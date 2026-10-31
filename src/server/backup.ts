import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'
import * as tar from 'tar'
import { z } from 'zod'
import { db } from './db'
import { dataRoot, backupLimit } from './storage-config'
import { resolveMediaPath } from './media-path'
import { blockLibraryAccess, withMaintenance } from './maintenance'

const fileSchema = z
  .object({
    path: z.string().min(1).max(500),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
const manifestSchema = z
  .object({
    format: z.literal('luden-backup'),
    version: z.literal(1),
    createdAt: z.string().datetime(),
    migrations: z.array(z.string()).max(1000),
    games: z.number().int().nonnegative(),
    database: fileSchema,
    images: z.array(fileSchema).max(100000),
  })
  .strict()
type Manifest = z.infer<typeof manifestSchema>
const idSchema = z.string().uuid()
const pending = new Map<string, { directory: string; manifest: Manifest; expires: number }>()

function databaseConfig() {
  const url = new URL(process.env.DATABASE_URL || '')
  const user = process.env.POSTGRES_USER || 'luden'
  const database = process.env.POSTGRES_DB || 'luden'
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    decodeURIComponent(url.username) !== user ||
    decodeURIComponent(url.pathname.slice(1)) !== database ||
    (url.port || '5432') !== (process.env.POSTGRES_PORT || '5434') ||
    (url.searchParams.get('schema') || 'public') !== 'public' ||
    !/^[a-zA-Z0-9_]+$/.test(database)
  )
    throw new Error(
      'La sauvegarde intégrée nécessite le PostgreSQL du compose.yaml et un DATABASE_URL cohérent (schéma public).',
    )
  return { user, database }
}

// Arguments are passed directly; no shell, credentials, or uploaded names in commands.
async function postgres(
  command: string,
  args: string[],
  options: { input?: string; output?: string } = {},
) {
  const child = spawn('docker', ['compose', 'exec', '-T', 'db', command, ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let stderr = ''
  let stdout = ''
  child.stderr.on('data', (bytes: Buffer) => {
    stderr = (stderr + bytes.toString()).slice(-4096)
  })
  if (!options.output)
    child.stdout.on('data', (bytes: Buffer) => {
      stdout += bytes.toString()
      if (stdout.length > 64 * 1024 * 1024) child.kill()
    })
  const exited = new Promise<void>((resolve, reject) => {
    child.on('error', () =>
      reject(new Error('Docker est indisponible. Démarrez Docker Desktop puis npm run db:up.')),
    )
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Opération PostgreSQL impossible (${command}). Vérifiez Docker et la configuration de la base.`,
            ),
          ),
    )
  })
  // Consume errors immediately even if a pipeline rejects first (e.g. disk full).
  const output = options.output
    ? pipeline(child.stdout, createWriteStream(options.output, { flags: 'wx' }))
    : Promise.resolve()
  const input = options.input
    ? pipeline(createReadStream(options.input), child.stdin)
    : Promise.resolve(child.stdin.end()).then(() => undefined)
  try {
    await Promise.all([exited, output, input])
  } catch (error) {
    child.kill()
    throw error
  }
  // PostgreSQL diagnostics may contain personal values: never expose stderr in HTTP responses.
  void stderr
  return stdout
}

async function sql(database: string, statement: string) {
  const { user } = databaseConfig()
  return postgres('psql', [
    '-X',
    '-U',
    user,
    '-d',
    database,
    '-v',
    'ON_ERROR_STOP=1',
    '-At',
    '-c',
    statement,
  ])
}

async function digest(file: string) {
  const hash = createHash('sha256')
  for await (const bytes of createReadStream(file)) hash.update(bytes)
  return { bytes: (await stat(file)).size, sha256: hash.digest('hex') }
}

async function currentMigrations() {
  const rows = await db.$queryRaw<
    { migration_name: string }[]
  >`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`
  return rows.map((row) => row.migration_name)
}

async function newWork() {
  const directory = path.join(dataRoot(), 'backups', '.work', randomUUID())
  await mkdir(directory, { recursive: true })
  return directory
}

async function createSnapshot() {
  const { user, database } = databaseConfig()
  const work = await newWork()
  try {
    await mkdir(path.join(work, 'media'))
    const media = await db.media.findMany({ select: { path: true } })
    const platforms = await db.platformVisual.findMany({ select: { path: true } })
    const images: Manifest['images'] = []
    let total = 0
    for (const relative of [
      ...new Set([...media, ...platforms].map((image) => image.path)),
    ].sort()) {
      const source = resolveMediaPath(dataRoot(), relative)
      // Refuse links in every component, including media/, without following them.
      let current = path.join(dataRoot(), 'media')
      for (const part of ['', ...relative.split('/')]) {
        current = path.join(current, part)
        if ((await lstat(current)).isSymbolicLink())
          throw new Error('Un lien symbolique empêche la sauvegarde des images.')
      }
      if (!(await lstat(source)).isFile())
        throw new Error('Une image enregistrée est absente ou invalide.')
      const target = resolveMediaPath(work, relative)
      await mkdir(path.dirname(target), { recursive: true })
      await copyFile(source, target)
      const info = await digest(target)
      total += info.bytes
      if (total > backupLimit())
        throw new Error('Images trop volumineuses pour la limite LUDEN_BACKUP_MAX_MB.')
      images.push({ path: relative, ...info })
    }
    const dump = path.join(work, 'database.dump')
    await postgres(
      'pg_dump',
      [
        '-U',
        user,
        '-d',
        database,
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        '--schema=public',
      ],
      { output: dump },
    )
    const manifest: Manifest = {
      format: 'luden-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      migrations: await currentMigrations(),
      games: await db.game.count(),
      database: { path: 'database.dump', ...(await digest(dump)) },
      images,
    }
    if (total + manifest.database.bytes > backupLimit())
      throw new Error('Sauvegarde trop volumineuse pour la limite configurée.')
    await writeFile(path.join(work, 'manifest.json'), JSON.stringify(manifest, null, 2), {
      flag: 'wx',
    })
    const id = randomUUID()
    const destination = path.join(dataRoot(), 'backups', `${id}.luden.tar.gz`)
    const temporary = `${destination}.pending`
    try {
      await tar.c({ gzip: true, cwd: work, file: temporary, portable: true, noMtime: true }, [
        'manifest.json',
        'database.dump',
        ...images.map((image) => `media/${image.path}`),
      ])
      await rename(temporary, destination)
    } finally {
      await rm(temporary, { force: true })
    }
    return {
      id,
      createdAt: manifest.createdAt,
      games: manifest.games,
      images: images.length,
      bytes: (await stat(destination)).size,
    }
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

export function createBackup() {
  return withMaintenance(createSnapshot)
}

export function backupFile(id: string) {
  return path.join(dataRoot(), 'backups', `${idSchema.parse(id)}.luden.tar.gz`)
}

export function validateArchiveEntry(name: string, type: string, size: number) {
  if (
    !['File', 'Directory'].includes(type) ||
    !Number.isSafeInteger(size) ||
    size < 0 ||
    name.includes('\\') ||
    name.includes(':') ||
    name.startsWith('/') ||
    name
      .split('/')
      .some(
        (part, index, parts) =>
          part === '..' ||
          part === '.' ||
          (!part && index !== parts.length - 1) ||
          [...part].some((character) => character.charCodeAt(0) < 32) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part),
      ) ||
    !(name === 'manifest.json' || name === 'database.dump' || name.startsWith('media/'))
  )
    throw new Error('Archive invalide : chemin ou type de fichier interdit.')
}

export async function inspectBackup(request: Request) {
  await cleanupPending()
  if (pending.size >= 3)
    throw new Error(
      'Trois sauvegardes attendent déjà une confirmation. Réessayez dans trente minutes ou redémarrez Luden.',
    )
  if (!request.body) throw new Error('Choisissez une sauvegarde Luden.')
  const work = await newWork()
  try {
    const archive = path.join(work, 'upload.tar.gz')
    let received = 0
    const body = Readable.fromWeb(request.body as import('node:stream/web').ReadableStream)
    await pipeline(
      body,
      async function* (source) {
        for await (const bytes of source) {
          received += bytes.length
          if (received > backupLimit())
            throw new Error('Archive trop volumineuse pour la limite configurée.')
          yield bytes
        }
      },
      createWriteStream(archive, { flags: 'wx' }),
    )
    // Bound actual decompression before parsing tar headers (including forged sizes).
    const plain = path.join(work, 'upload.tar')
    let uncompressed = 0
    await pipeline(
      createReadStream(archive),
      createGunzip(),
      async function* (source) {
        for await (const bytes of source) {
          uncompressed += bytes.length
          if (uncompressed > backupLimit() + 64 * 1024 * 1024)
            throw new Error('Archive décompressée trop volumineuse.')
          yield bytes
        }
      },
      createWriteStream(plain, { flags: 'wx' }),
    )
    let expanded = 0
    let invalid: Error | undefined
    const entries = new Set<string>()
    await tar.t({
      file: plain,
      strict: true,
      onReadEntry(entry) {
        try {
          validateArchiveEntry(entry.path, entry.type, entry.size)
          expanded += entry.size
          if (expanded > backupLimit() || entries.size >= 100002 || entries.has(entry.path))
            throw new Error('Archive trop volumineuse ou contenant des doublons.')
          if (entry.path === 'manifest.json' && entry.size > 32 * 1024 * 1024)
            throw new Error('Manifest trop volumineux.')
          entries.add(entry.path)
        } catch (error) {
          invalid = error instanceof Error ? error : new Error('Archive invalide.')
        }
      },
    })
    if (invalid) throw invalid
    const extracted = path.join(work, 'contents')
    await mkdir(extracted)
    await tar.x({ file: plain, cwd: extracted, strict: true, preservePaths: false })
    const manifest = manifestSchema.parse(
      JSON.parse(await readFile(path.join(extracted, 'manifest.json'), 'utf8')),
    )
    if (manifest.database.path !== 'database.dump') throw new Error('Dump non reconnu.')
    const expected = new Set([
      'manifest.json',
      'database.dump',
      ...manifest.images.map((image) => `media/${image.path}`),
    ])
    for (const entry of entries)
      if (!expected.has(entry) && !entry.endsWith('/'))
        throw new Error('Fichier non prévu dans la sauvegarde.')
    for (const image of manifest.images) resolveMediaPath(extracted, image.path)
    if (new Set(manifest.images.map((image) => image.path)).size !== manifest.images.length)
      throw new Error('Images en double.')
    for (const file of [manifest.database, ...manifest.images]) {
      const target =
        file === manifest.database
          ? path.join(extracted, 'database.dump')
          : resolveMediaPath(extracted, file.path)
      const actual = await digest(target)
      if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256)
        throw new Error('Sauvegarde incomplète ou endommagée.')
    }
    if (JSON.stringify(manifest.migrations) !== JSON.stringify(await currentMigrations()))
      throw new Error(
        'Cette sauvegarde utilise une autre version du schéma. Utilisez la même version de Luden pour la restaurer.',
      )
    await rm(archive)
    await rm(plain)
    const id = randomUUID()
    pending.set(id, { directory: work, manifest, expires: Date.now() + 30 * 60_000 })
    return {
      id,
      createdAt: manifest.createdAt,
      games: manifest.games,
      images: manifest.images.length,
    }
  } catch (error) {
    await rm(work, { recursive: true, force: true })
    throw error
  }
}

async function cleanupPending() {
  for (const [id, item] of pending)
    if (item.expires < Date.now()) {
      pending.delete(id)
      await rm(item.directory, { recursive: true, force: true })
    }
}

export async function discardBackup(id: string) {
  idSchema.parse(id)
  const item = pending.get(id)
  if (!item) return
  pending.delete(id)
  await rm(item.directory, { recursive: true, force: true })
}

export async function restoreBackup(id: string) {
  idSchema.parse(id)
  return withMaintenance(async () => {
    await cleanupPending()
    const item = pending.get(id)
    if (!item) throw new Error('La vérification a expiré. Sélectionnez à nouveau la sauvegarde.')
    pending.delete(id)
    const { user, database } = databaseConfig()
    const shadow = `luden_restore_${randomUUID().replaceAll('-', '')}`
    const contents = path.join(item.directory, 'contents')
    const dump = path.join(contents, 'database.dump')
    const media = path.join(dataRoot(), 'media')
    const previous = path.join(item.directory, 'previous-media')
    let shadowCreated = false
    let movedOld = false
    let installed = false
    let committed = false
    let journalWritten = false
    let databaseAttempted = false
    let safety: Awaited<ReturnType<typeof createSnapshot>> | undefined
    try {
      // A dump is executable SQL: the UI requires a trusted personal archive.
      await sql('postgres', `CREATE DATABASE "${shadow}"`)
      shadowCreated = true
      await postgres(
        'pg_restore',
        [
          '-U',
          user,
          '-d',
          shadow,
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-privileges',
          '--exit-on-error',
          '--single-transaction',
        ],
        { input: dump },
      )
      const migrations = (
        await sql(
          shadow,
          'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name',
        )
      )
        .trim()
        .split('\n')
        .filter(Boolean)
      if (JSON.stringify(migrations) !== JSON.stringify(await currentMigrations()))
        throw new Error('Le schéma du dump ne correspond pas à cette version de Luden.')
      const records = await sql(
        shadow,
        `SELECT path FROM "Media" UNION SELECT path FROM "PlatformVisual"`,
      )
      const listed = new Set(item.manifest.images.map((image) => image.path))
      for (const relative of records.trim().split('\n').filter(Boolean)) {
        resolveMediaPath(contents, relative)
        if (!listed.has(relative))
          throw new Error('Le dump référence une image absente de la sauvegarde.')
      }
      if (
        Number((await sql(shadow, 'SELECT count(*) FROM "Game"')).trim()) !== item.manifest.games ||
        (await sql(shadow, `SELECT count(*) FROM "Profile" WHERE id = 'local'`)).trim() !== '1'
      )
        throw new Error('Le contenu du dump est incohérent.')
      safety = await createSnapshot()
      const journalTemporary = path.join(dataRoot(), 'backups', `.journal-${randomUUID()}.pending`)
      try {
        await writeFile(journalTemporary, JSON.stringify({ version: 1, safetyId: safety.id }), {
          flag: 'wx',
        })
        await rename(journalTemporary, path.join(dataRoot(), 'backups', 'restore-journal.json'))
      } finally {
        await rm(journalTemporary, { force: true })
      }
      journalWritten = true
      const restoredMedia = path.join(contents, 'media')
      await mkdir(restoredMedia, { recursive: true })
      // New mtimes invalidate any pre-existing thumbnail cache at this installation.
      const now = new Date()
      for (const image of item.manifest.images)
        await utimes(resolveMediaPath(contents, image.path), now, now)
      try {
        await rename(media, previous)
        movedOld = true
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      await rename(restoredMedia, media)
      installed = true
      await db.$disconnect()
      databaseAttempted = true
      await postgres(
        'pg_restore',
        [
          '-U',
          user,
          '-d',
          database,
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-privileges',
          '--exit-on-error',
          '--single-transaction',
        ],
        { input: dump },
      )
      committed = true
      await rm(path.join(dataRoot(), 'backups', 'restore-journal.json'))
      return {
        safetyId: safety.id,
        games: item.manifest.games,
        images: item.manifest.images.length,
      }
    } catch (error) {
      committed = false
      try {
        if (journalWritten && databaseAttempted) {
          // A lost Docker connection can hide a successful COMMIT. Restore both
          // stores from the safety copy rather than guessing the database state.
          await recoverInterruptedRestore()
        } else {
          if (installed) await rm(media, { recursive: true, force: true })
          if (movedOld) await rename(previous, media)
          if (journalWritten)
            await rm(path.join(dataRoot(), 'backups', 'restore-journal.json'), { force: true })
        }
      } catch {
        blockLibraryAccess()
        throw new Error(
          `Restauration interrompue. Redémarrez Luden pour reprendre la sauvegarde de sécurité ${safety?.id || ''}. Ne supprimez ni le journal ni les fichiers de sauvegarde.`,
        )
      }
      throw new Error(
        `${error instanceof Error ? error.message : 'Restauration impossible.'}${safety ? ` Sauvegarde de sécurité : ${safety.id}.luden.tar.gz.` : ''}`,
      )
    } finally {
      if (shadowCreated)
        await sql('postgres', `DROP DATABASE IF EXISTS "${shadow}" WITH (FORCE)`).catch(
          () => undefined,
        )
      // On rollback failure, keep previous-media for manual recovery.
      if (committed || !movedOld || !(await stat(previous).catch(() => null)))
        await rm(item.directory, { recursive: true, force: true }).catch(() => undefined)
    }
  })
}

// A process/machine crash can happen between disk moves and the DB commit. On the
// next request, deterministically return to the safety snapshot before allowing IO.
// The journal contains only an archive UUID; uploaded paths never control recovery.
export async function recoverInterruptedRestore() {
  if (!process.env.LUDEN_DATA_DIR?.trim()) return
  const journal = path.join(dataRoot(), 'backups', 'restore-journal.json')
  const text = await readFile(journal, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (!text) return
  const record = z
    .object({ version: z.literal(1), safetyId: idSchema })
    .strict()
    .parse(JSON.parse(text))
  const { user, database } = databaseConfig()
  const work = await newWork()
  // This archive was created by this installation immediately before replacement.
  // Keep it and the journal until both DB and media are recovered successfully.
  try {
    await tar.x({
      file: backupFile(record.safetyId),
      cwd: work,
      strict: true,
      preservePaths: false,
    })
    const restoredMedia = path.join(work, 'media')
    await mkdir(restoredMedia, { recursive: true })
    await db.$disconnect()
    await postgres(
      'pg_restore',
      [
        '-U',
        user,
        '-d',
        database,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--exit-on-error',
        '--single-transaction',
      ],
      { input: path.join(work, 'database.dump') },
    )
    const media = path.join(dataRoot(), 'media')
    // Validated configured root and fixed child; never remove the root itself.
    await rm(media, { recursive: true, force: true })
    await rename(restoredMedia, media)
    await rm(journal)
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => undefined)
  }
}
