import 'dotenv/config'
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { db } from '../src/server/db'
import { mediaDestinations, commitMediaMove } from '../src/server/media-organization'
import {
  imageHash,
  pruneEmptyMediaDirectories,
  relocateImage,
  withMediaStorageLock,
  type MediaMove,
} from '../src/server/media-storage'
import { resolveMediaPath } from '../src/server/media-path'

const root = process.env.LUDEN_DATA_DIR?.trim() ?? ''
const mediaRoot = path.dirname(resolveMediaPath(root, '.organisation.lock'))
type Manifest = {
  version: 1
  root: string
  createdAt: string
  moves: MediaMove[]
  missingUnused: { id: string; from: string }[]
}

async function filesIn(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Lien symbolique à examiner : ${entry.name}`)
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await filesIn(absolute)))
    else if (entry.isFile())
      result.push(path.relative(mediaRoot, absolute).split(path.sep).join('/'))
  }
  return result
}

async function plan(): Promise<Manifest> {
  const destinations = await mediaDestinations()
  const registered = new Set(destinations.map((m) => m.from))
  const targets = new Set(destinations.map((m) => m.to))
  const moves: MediaMove[] = []
  const missingUnused: Manifest['missingUnused'] = []
  // Read every source now: a missing file stops the whole run before any migration.
  for (const entry of destinations) {
    try {
      const sha256 = await imageHash(resolveMediaPath(root, entry.from))
      if (entry.from !== entry.to) moves.push({ ...entry, sha256 })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || !entry.to.startsWith('_sans-jeu/'))
        throw error
      missingUnused.push({ id: entry.id, from: entry.from })
    }
  }
  for (const from of await filesIn(mediaRoot)) {
    if (
      registered.has(from) ||
      targets.has(from) ||
      (from.endsWith('.pending') && targets.has(from.slice(0, -8))) ||
      from === '.organisation.lock' ||
      // Platform visuals have their own table and lifecycle, including inactive imports.
      from.startsWith('plateformes/') ||
      from.startsWith('_sans-reference/')
    )
      continue
    // Unregistered files are preserved, with their original relative hierarchy.
    moves.push({
      id: null,
      from,
      to: `_sans-reference/${from}`,
      sha256: await imageHash(resolveMediaPath(root, from)),
    })
  }
  for (const move of moves) {
    try {
      if ((await imageHash(resolveMediaPath(root, move.to))) !== move.sha256)
        throw new Error(`Destination occupée par un autre fichier : ${move.to}`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return {
    version: 1,
    root: path.resolve(root),
    createdAt: new Date().toISOString(),
    moves,
    missingUnused,
  }
}

async function backupDatabase(destination: string) {
  const child = spawn(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'sh',
      '-c',
      'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  )
  let stderr = ''
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString()
  })
  const completed = new Promise<void>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`Sauvegarde PostgreSQL échouée : ${stderr}`)),
    )
  })
  await Promise.all([
    pipeline(child.stdout, createWriteStream(destination, { flags: 'wx' })),
    completed,
  ])
  if ((await stat(destination)).size === 0) throw new Error('Sauvegarde PostgreSQL vide.')
}

function summary(manifest: Manifest) {
  console.log(
    JSON.stringify(
      {
        mediasAClasser: manifest.moves.filter((m) => m.id).length,
        fichiersSansReferenceAPreserver: manifest.moves.filter((m) => !m.id).length,
        entreesSansFichierNiJeu: manifest.missingUnused.length,
        exemples: manifest.moves.slice(0, 3).map((m) => ({ avant: m.from, apres: m.to })),
      },
      null,
      2,
    ),
  )
}

async function apply(manifest: Manifest, folder: string) {
  if (manifest.moves.some((move) => move.from.startsWith('plateformes/')))
    throw new Error(
      'Ce journal ancien inclut des visuels de plateforme. Recalculez le rangement des jeux.',
    )
  for (const [index, move] of manifest.moves.entries()) {
    await relocateImage(root, move, () => commitMediaMove(move))
    if ((index + 1) % 100 === 0)
      console.log(`${index + 1}/${manifest.moves.length} fichiers rangés`)
  }
  for (const missing of manifest.missingUnused) {
    await db.media.deleteMany({
      where: {
        id: missing.id,
        path: missing.from,
        games: { none: {} },
        attachments: { none: {} },
      },
    })
  }
  for (const legacy of ['games/covers', 'images']) {
    await pruneEmptyMediaDirectories(root, resolveMediaPath(root, legacy))
  }
  // Recheck the entire plan from disk and DB before reporting completion.
  for (const move of manifest.moves) {
    if ((await imageHash(resolveMediaPath(root, move.to))) !== move.sha256)
      throw new Error(`Vérification finale échouée : ${move.to}`)
    if (move.id && (await db.media.findUniqueOrThrow({ where: { id: move.id } })).path !== move.to)
      throw new Error(`Chemin en base différent : ${move.id}`)
  }
  await writeFile(
    path.join(folder, 'termine.json'),
    JSON.stringify(
      { completedAt: new Date().toISOString(), files: manifest.moves.length },
      null,
      2,
    ),
  )
  console.log(
    `Terminé : ${manifest.moves.length} fichiers vérifiés. Sauvegarde et journal : ${folder}`,
  )
}

try {
  const args = process.argv.slice(2)
  if (args.length === 0) summary(await plan())
  else if (args.length === 1 && args[0] === '--apply') {
    await withMediaStorageLock(root, async () => {
      const manifest = await plan()
      summary(manifest)
      if (!manifest.moves.length && !manifest.missingUnused.length) return
      const folder = path.join(
        root,
        'backups',
        `rangement-medias-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      )
      await mkdir(folder, { recursive: true })
      await backupDatabase(path.join(folder, 'database.dump'))
      await writeFile(path.join(folder, 'plan.json'), JSON.stringify(manifest, null, 2), {
        flag: 'wx',
        flush: true,
      })
      console.log(`Journal de reprise : ${path.join(folder, 'plan.json')}`)
      await apply(manifest, folder)
    })
  } else if (args.length === 2 && args[0] === '--resume') {
    const file = path.resolve(args[1])
    const within = path.relative(path.join(root, 'backups'), file)
    if (within.startsWith('..') || path.isAbsolute(within))
      throw new Error('Le journal doit être dans LUDEN_DATA_DIR/backups.')
    const manifest = JSON.parse(await readFile(file, 'utf8')) as Manifest
    if (manifest.version !== 1 || manifest.root !== path.resolve(root))
      throw new Error('Journal incompatible avec ce dossier de données.')
    await withMediaStorageLock(root, () => apply(manifest, path.dirname(file)))
  } else
    throw new Error('Usage : npm run media:organize [-- --apply | -- --resume chemin/plan.json]')
} finally {
  await db.$disconnect()
}
