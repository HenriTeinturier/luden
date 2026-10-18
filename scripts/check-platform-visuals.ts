// Isolated DB/filesystem fixtures; no personal platform or file is modified.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { mkdtemp, unlink, rmdir, access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import {
  savePlatformImage,
  savePlatformVisuals,
  readPlatformImage,
  deletePlatformVisual,
} from '../src/server/platform-visuals'
import { resolveMediaPath } from '../src/server/media-path'
import { exportLibrary, loadLibrary } from '../src/server/library'
import { platformAssetKinds, readPlatformCustomization } from '../src/lib/platform-customization'

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
  const assets = []
  for (const kind of platformAssetKinds)
    assets.push(await savePlatformImage(platformId, kind, bytes, kind))
  const visuals = [banner, poster, inactive, ...assets].map((v) => ({
    ...v,
    active: v.id !== inactive.id,
    isDefault: v.id !== inactive.id,
  }))
  const customization = readPlatformCustomization({
    title: 'Plateforme personnalisée',
    dateLabel: '1998–2002',
    preset: 'jewel-case',
    scenePreset: 'mini-disc',
    cardEnabled: true,
    card: { logoHeight: 80 },
    sidebarMode: 'composition',
  })
  await savePlatformVisuals({
    platformId,
    visuals,
    customization,
    slideshow: { enabled: true, seconds: 12 },
  })
  const configured = await db.platform.findUniqueOrThrow({ where: { id: platformId } })
  assert.equal(configured.slideshowEnabled, true)
  assert.equal(configured.slideshowSeconds, 12)
  assert.deepEqual(configured.customization, customization)
  const loaded = (await loadLibrary()).platforms.find((p) => p.id === platformId)!
  assert.equal(loaded.name, customization.title)
  assert.equal(loaded.catalogName, 'Fixture visuels')
  await assert.rejects(
    savePlatformVisuals({
      platformId,
      visuals: [],
      customization: { ...customization, title: 'Sauvegarde périmée' },
    }),
  )
  assert.deepEqual(
    (await db.platform.findUniqueOrThrow({ where: { id: platformId } })).customization,
    customization,
  )
  await assert.rejects(
    savePlatformVisuals({ platformId, visuals, slideshow: { enabled: true, seconds: 0 } }),
  )
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
  assert.equal(await db.platformVisual.count({ where: { platformId, ownerId } }), 9)
  assert.ok(await readPlatformImage(inactive.id))
  const exported = await exportLibrary()
  assert.equal(exported.version, 8)
  assert.deepEqual(
    exported.platforms.find((p) => p.id === platformId)?.customization,
    customization,
  )
  assert.equal(exported.platforms.find((p) => p.id === platformId)?.slideshowSeconds, 12)
  assert.equal(exported.platformVisuals.filter((v) => v.platformId === platformId).length, 9)
  await savePlatformVisuals({ platformId, visuals: visuals.map((v) => ({ ...v, active: true })) })
  const posterRecord = await db.platformVisual.findUniqueOrThrow({ where: { id: poster.id } })
  await assert.rejects(deletePlatformVisual({ platformId: 'snes', id: poster.id }))
  assert.ok(await readPlatformImage(poster.id))
  assert.equal((await deletePlatformVisual({ platformId, id: poster.id })).warning, null)
  assert.equal(await readPlatformImage(poster.id), null)
  await assert.rejects(access(resolveMediaPath(root, posterRecord.path)))
  assert.equal(
    (await db.platformVisual.findUniqueOrThrow({ where: { id: inactive.id } })).isDefault,
    true,
  )
  assert.equal(
    (await db.platformVisual.findUniqueOrThrow({ where: { id: banner.id } })).isDefault,
    true,
  )
  await deletePlatformVisual({ platformId, id: inactive.id })
  assert.equal(await db.platformVisual.count({ where: { platformId, kind: 'POSTER' } }), 0)
  await deletePlatformVisual({ platformId, id: banner.id })
  for (const asset of assets) await deletePlatformVisual({ platformId, id: asset.id })
  assert.equal(await db.platformVisual.count({ where: { platformId } }), 0)
  console.log(
    'Plateforme : imports, défauts, validation, inactifs, export et suppressions DB/fichiers vérifiés.',
  )
} finally {
  const records = await db.platformVisual.findMany({ where: { platformId, ownerId } })
  await db.platform.deleteMany({ where: { id: platformId } })
  for (const record of records) await unlink(resolveMediaPath(root, record.path))
  for (const folder of [
    'bandeaux',
    'affiches',
    ...platformAssetKinds.map((kind) => kind.toLowerCase()),
  ])
    await rmdir(path.join(root, 'media', 'plateformes', platformId, folder)).catch(() => undefined)
  await rmdir(path.join(root, 'media', 'plateformes', platformId)).catch(() => undefined)
  await rmdir(path.join(root, 'media', 'plateformes')).catch(() => undefined)
  await rmdir(path.join(root, 'media')).catch(() => undefined)
  await rmdir(root)
  process.env.LUDEN_DATA_DIR = originalRoot
  await db.$disconnect()
}
