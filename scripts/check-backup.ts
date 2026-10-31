// Executed by verify-release.ts only, against its disposable installation.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { db } from '../src/server/db'
import { resolveMediaPath } from '../src/server/media-path'

if (
  process.env.LUDEN_VERIFY_ISOLATED !== '1' ||
  !process.env.POSTGRES_DB?.startsWith('luden_verify_') ||
  !process.env.COMPOSE_PROJECT_NAME?.startsWith('luden-verify-')
)
  throw new Error(
    'Ce contrôle est réservé à une installation jetable créée par npm run verify:release.',
  )

const origin = `http://127.0.0.1:${process.env.PORT}`
async function json(url: string, init?: RequestInit) {
  const response = await fetch(`${origin}${url}`, init)
  const value = await response.json()
  assert.ok(response.ok, JSON.stringify(value))
  return value
}

try {
  assert.equal(
    await db.game.count(),
    0,
    'Une nouvelle installation ne contient aucun jeu personnel.',
  )
  assert.equal(await db.collection.count(), 2)
  for (const route of ['/', '/settings', '/platforms', '/library']) {
    const page = await fetch(`${origin}${route}`)
    assert.equal(page.status, 200, route)
  }
  const crossSite = await fetch(`${origin}/api/backup`, {
    method: 'POST',
    headers: { Origin: 'https://example.com' },
  })
  assert.equal(crossSite.status, 400)
  const badUpload = await fetch(`${origin}/api/restore`, { method: 'POST', body: 'not an archive' })
  assert.equal(badUpload.status, 400)
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#123456' } })
    .png()
    .toBuffer()
  const form = new FormData()
  form.set('image', new File([png], 'example.png', { type: 'image/png' }))
  const imported = await json('/api/media', { method: 'POST', body: form })
  await db.game.create({
    data: {
      id: 'verification-game',
      title: 'Exemple de vérification',
      ownerId: 'local',
      platformId: 'snes',
      coverId: imported.id,
    },
  })
  const platformPath = 'plateformes/snes/logo/verification.webp'
  const platformFile = resolveMediaPath(process.env.LUDEN_DATA_DIR!, platformPath)
  await mkdir(path.dirname(platformFile), { recursive: true })
  await writeFile(platformFile, png)
  await db.platformVisual.create({
    data: {
      id: 'verification-platform',
      ownerId: 'local',
      platformId: 'snes',
      kind: 'LOGO',
      path: platformPath,
      width: 1,
      height: 1,
    },
  })
  const media = await db.media.findUniqueOrThrow({ where: { id: imported.id } })
  const original = await readFile(resolveMediaPath(process.env.LUDEN_DATA_DIR!, media.path))
  const backup = await json('/api/backup', { method: 'POST' })
  assert.equal(backup.games, 1)
  assert.equal(backup.images, 2)
  const archive = await fetch(`${origin}/api/backup?id=${backup.id}`)
  assert.equal(archive.status, 200)
  assert.ok(archive.headers.get('content-disposition')?.includes('.luden.tar.gz'))
  const bytes = await archive.arrayBuffer()
  const traversal = await fetch(`${origin}/api/backup?id=../../.env`)
  assert.equal(traversal.status, 404)
  // The saved snapshot must restore data that has actually changed in both stores.
  await db.game.update({
    where: { id: 'verification-game' },
    data: { title: 'Modification après sauvegarde' },
  })
  await writeFile(resolveMediaPath(process.env.LUDEN_DATA_DIR!, media.path), 'changed-image')
  const preview = await json('/api/restore', { method: 'POST', body: bytes })
  assert.equal(preview.games, 1)
  assert.equal(
    (await db.game.findUniqueOrThrow({ where: { id: 'verification-game' } })).title,
    'Modification après sauvegarde',
    'La prévisualisation ne modifie rien.',
  )
  const denied = await fetch(`${origin}/api/restore`, {
    method: 'PUT',
    headers: { 'x-luden-restore-id': preview.id },
  })
  assert.equal(denied.status, 400)
  await db.$disconnect()
  const restored = await json('/api/restore', {
    method: 'PUT',
    headers: { 'x-luden-restore-id': preview.id, 'x-luden-confirm': 'replace-trusted-backup' },
  })
  assert.ok(restored.safetyId)
  assert.equal(
    (await db.game.findUniqueOrThrow({ where: { id: 'verification-game' } })).title,
    'Exemple de vérification',
  )
  assert.deepEqual(
    await readFile(resolveMediaPath(process.env.LUDEN_DATA_DIR!, media.path)),
    original,
  )
  assert.deepEqual(await readFile(platformFile), png)
  assert.ok(
    (await readdir(path.join(process.env.LUDEN_DATA_DIR!, 'backups'))).includes(
      `${restored.safetyId}.luden.tar.gz`,
    ),
  )
  const replay = await fetch(`${origin}/api/restore`, {
    method: 'PUT',
    headers: { 'x-luden-restore-id': preview.id, 'x-luden-confirm': 'replace-trusted-backup' },
  })
  assert.equal(replay.status, 400)
  const exportData = await json('/api/export')
  assert.ok(JSON.stringify(exportData).includes('Exemple de vérification'))
  // Verify the archive itself contains neither env/cache nor PostgreSQL credentials.
  const tar = await import('tar')
  const names: string[] = []
  await tar.t({
    file: path.join(process.env.LUDEN_DATA_DIR!, 'backups', `${backup.id}.luden.tar.gz`),
    onReadEntry(entry) {
      names.push(entry.path)
    },
  })
  assert.deepEqual(
    names.sort(),
    ['database.dump', 'manifest.json', `media/${media.path}`, `media/${platformPath}`].sort(),
  )
  // Simulate an interrupted restore: a restart must return to the safety snapshot.
  await writeFile(
    path.join(process.env.LUDEN_DATA_DIR!, 'backups', 'restore-journal.json'),
    JSON.stringify({ version: 1, safetyId: backup.id }),
  )
  await db.game.update({
    where: { id: 'verification-game' },
    data: { title: 'Interruption simulée' },
  })
  await rm(resolveMediaPath(process.env.LUDEN_DATA_DIR!, media.path))
  // Recovery is tested in a fresh child, mirroring a server restart.
  const { spawn } = await import('node:child_process')
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        "const { recoverInterruptedRestore } = await import('./src/server/backup.ts'); await recoverInterruptedRestore(); const { db } = await import('./src/server/db.ts'); await db.$disconnect()",
      ],
      { stdio: 'inherit', windowsHide: true },
    )
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error('Récupération après interruption échouée.')),
    )
  })
  assert.equal(
    (await db.game.findUniqueOrThrow({ where: { id: 'verification-game' } })).title,
    'Exemple de vérification',
  )
  assert.equal(
    createHash('sha256')
      .update(await readFile(resolveMediaPath(process.env.LUDEN_DATA_DIR!, media.path)))
      .digest('hex'),
    createHash('sha256').update(original).digest('hex'),
  )
  console.log(
    'Installation vide, pages HTTP, import image, sauvegarde, aperçu, confirmation, remplacement DB/images, copie de sécurité, refus des requêtes externes et reprise après interruption : OK.',
  )
} finally {
  await db.$disconnect()
}
