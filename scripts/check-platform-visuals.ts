// Isolated DB/filesystem fixtures; no personal platform or file is modified.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { mkdtemp, unlink, rmdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import {
  savePlatformImage,
  savePlatformVisuals,
  readPlatformImage,
} from '../src/server/platform-visuals'
import { resolveMediaPath } from '../src/server/media-path'
import { exportLibrary } from '../src/server/library'

const originalRoot = process.env.LUDEN_DATA_DIR
const root = await mkdtemp(path.join(os.tmpdir(), 'luden-platform-'))
process.env.LUDEN_DATA_DIR = root
const platformId = `test-${Date.now()}`
try {
  await db.platform.create({
    data: {
      id: platformId,
      name: 'Fixture visuels',
      shortName: 'Test',
      family: 'Test',
      color: '#123456',
      era: 'Test',
    },
  })
  const bytes = await sharp({
    create: { width: 64, height: 32, channels: 4, background: '#7451ae80' },
  })
    .png()
    .toBuffer()
  const banner = await savePlatformImage(platformId, 'BANNER', bytes, 'Bandeau test')
  const poster = await savePlatformImage(platformId, 'POSTER', bytes, 'Affiche test')
  const inactive = await savePlatformImage(platformId, 'POSTER', bytes, 'Inactive test')
  const visuals = [banner, poster, inactive].map((v) => ({
    ...v,
    active: v.id !== inactive.id,
    isDefault: v.id !== inactive.id,
  }))
  await savePlatformVisuals({ platformId, visuals })
  assert.ok(await readPlatformImage(poster.id))
  assert.equal(await readPlatformImage('missing'), null)
  assert.equal(
    (await db.platformVisual.findUniqueOrThrow({ where: { id: poster.id } })).isDefault,
    true,
  )
  await assert.rejects(
    savePlatformVisuals({
      platformId,
      visuals: visuals.map((v) =>
        v.id === inactive.id ? { ...v, active: true, isDefault: true } : v,
      ),
    }),
  )
  await assert.rejects(savePlatformVisuals({ platformId: 'snes', visuals }))
  await assert.rejects(savePlatformImage('../invalid', 'POSTER', bytes, 'bad'))
  await assert.rejects(savePlatformImage(platformId, 'POSTER', Buffer.from('not an image'), 'bad'))
  await savePlatformVisuals({
    platformId,
    visuals: visuals.map((v) => ({ ...v, active: false, isDefault: false })),
  })
  assert.equal(await db.platformVisual.count({ where: { platformId, ownerId } }), 3)
  assert.ok(await readPlatformImage(inactive.id))
  const exported = await exportLibrary()
  assert.equal(exported.version, 5)
  assert.equal(exported.platformVisuals.filter((v) => v.platformId === platformId).length, 3)
  console.log(
    'Plateforme : imports, defaults, validation, désactivation sans suppression, lecture et export vérifiés.',
  )
} finally {
  const records = await db.platformVisual.findMany({ where: { platformId, ownerId } })
  await db.platform.deleteMany({ where: { id: platformId } })
  for (const record of records) await unlink(resolveMediaPath(root, record.path))
  for (const folder of ['bandeaux', 'affiches'])
    await rmdir(path.join(root, 'media', 'plateformes', platformId, folder)).catch(() => undefined)
  await rmdir(path.join(root, 'media', 'plateformes', platformId)).catch(() => undefined)
  await rmdir(path.join(root, 'media', 'plateformes')).catch(() => undefined)
  await rmdir(path.join(root, 'media')).catch(() => undefined)
  await rmdir(root)
  process.env.LUDEN_DATA_DIR = originalRoot
  await db.$disconnect()
}
