// Optional, small integration check against the local DB. Only its own fixtures are removed.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { mkdtemp, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import { saveImage, readImage, removeUnusedImages } from '../src/server/media'
import { saveGame, deleteGame, exportLibrary } from '../src/server/library'
import { emptyGame } from '../src/lib/validation'
import { resolveMediaPath } from '../src/server/media-path'

const originalRoot = process.env.LUDEN_DATA_DIR
process.env.LUDEN_DATA_DIR = await mkdtemp(path.join(os.tmpdir(), 'luden-media-check-'))
const gameIds: string[] = [],
  imageIds: string[] = []
try {
  const existing = await db.game.findMany({
    where: { ownerId, coverId: { not: null } },
    include: { media: true },
  })
  assert.ok(
    existing.every((g) => g.media.some((m) => m.mediaId === g.coverId && m.isPrimary)),
    'Existing covers remain primary after migration',
  )
  const fixture = await sharp({
    create: { width: 320, height: 180, channels: 3, background: '#778855' },
  })
    .png()
    .toBuffer()
  const image = await saveImage(fixture)
  imageIds.push(image.id)
  const second = await saveImage(fixture, 'https://example.com/image.png', 'EXTERNAL_URL')
  imageIds.push(second.id)
  const info = await db.media.findUniqueOrThrow({ where: { id: image.id } })
  assert.equal(info.width / info.height, 320 / 180)
  const provisionalFile = resolveMediaPath(process.env.LUDEN_DATA_DIR!, info.path)
  assert.ok(info.path.startsWith('_imports/'))
  // Legacy input with only coverId must still create the new default gallery.
  const base = {
    ...emptyGame,
    title: 'Luden · contrôle temporaire médias',
    platformId: 'snes',
    media: undefined,
    links: undefined,
    coverId: image.id,
    possessions: [{ format: 'PHYSICAL', state: 'CURRENT', store: '' }],
  }
  const created = await saveGame(base)
  gameIds.push(created.id)
  assert.equal(created.mediaWarning, null)
  const organized = await db.media.findUniqueOrThrow({ where: { id: image.id } })
  assert.ok(organized.path.startsWith('jeux/snes/luden-controle-temporaire-medias--'))
  assert.ok(await readImage(image.id))
  await assert.rejects(access(provisionalFile))
  const initial = await db.game.findUniqueOrThrow({
    where: { id: created.id },
    include: { media: true, possessions: true },
  })
  assert.equal(initial.media[0].category, 'COVER')
  assert.equal(initial.media[0].isPrimary, true)
  const shared = await saveGame({ ...base, title: 'Luden · partage temporaire', possessions: [] })
  gameIds.push(shared.id)
  assert.equal(shared.mediaWarning, null)
  assert.ok(
    (await db.media.findUniqueOrThrow({ where: { id: image.id } })).path.startsWith('_partages/'),
  )
  await deleteGame(shared.id)
  assert.ok(await readImage(image.id), 'Deleting one game preserves an image shared with another')
  const possessionId = initial.possessions[0].id
  await db.mediaAttachment.create({
    data: { mediaId: image.id, possessionId, category: 'BOX', isPrimary: true },
  })
  const changed = {
    ...base,
    id: created.id,
    possessions: [{ ...base.possessions[0], id: possessionId }],
    media: [
      { mediaId: image.id, category: 'COVER', position: 1, caption: 'Boîte PAL', isPrimary: false },
      {
        mediaId: second.id,
        category: 'SCREENSHOT',
        position: 0,
        caption: 'Capture',
        isPrimary: true,
      },
    ],
    links: [
      { url: 'https://www.youtube.com/watch?v=test', type: 'VIDEO', position: 0, title: 'Vidéo' },
    ],
  }
  await saveGame(changed)
  const updated = await db.game.findUniqueOrThrow({
    where: { id: created.id },
    include: { media: true, links: true, possessions: { include: { media: true } } },
  })
  assert.equal(updated.coverId, second.id)
  assert.equal(updated.media.length, 2)
  assert.equal(updated.links.length, 1)
  assert.equal(updated.possessions[0].id, possessionId)
  assert.equal(updated.possessions[0].media.length, 1)
  await assert.rejects(
    saveGame({ ...changed, media: [{ ...changed.media[0], mediaId: 'missing', isPrimary: true }] }),
  )
  assert.equal(
    await db.mediaAttachment.count({ where: { gameId: created.id } }),
    2,
    'Failed update rolls back',
  )
  // Omission preserves galleries and links for compatibility with old forms.
  await saveGame({ ...changed, media: undefined, links: undefined })
  assert.equal(await db.mediaAttachment.count({ where: { gameId: created.id } }), 2)
  assert.equal(await db.gameLink.count({ where: { gameId: created.id } }), 1)
  const exported = await exportLibrary()
  assert.equal(exported.version, 5)
  assert.equal(exported.games.find((g) => g.id === created.id)?.links.length, 1)
  await saveGame({ ...changed, media: [], links: [] })
  assert.equal(await db.media.count({ where: { id: second.id } }), 0)
  assert.ok(await readImage(image.id), 'Photo of a retained copy must not be removed')
  const renamed = await saveGame({
    ...changed,
    title: 'Luden · autre titre',
    platformId: 'amiga',
    media: [],
    links: [],
  })
  assert.equal(renamed.id, created.id)
  assert.equal(renamed.mediaWarning, null)
  const moved = await db.media.findUniqueOrThrow({ where: { id: image.id } })
  assert.ok(moved.path.startsWith('jeux/amiga/luden-autre-titre--'))
  const originalFile = resolveMediaPath(process.env.LUDEN_DATA_DIR!, moved.path)
  await access(originalFile)
  await deleteGame(created.id)
  assert.equal(await db.media.count({ where: { id: image.id } }), 0)
  await assert.rejects(access(originalFile))
  console.log(
    'OK : migration des jaquettes, création, édition, exemplaires stables, galerie, liens, export, rollback et suppression des fichiers inutilisés.',
  )
} finally {
  for (const id of gameIds) await deleteGame(id)
  await removeUnusedImages(imageIds)
  process.env.LUDEN_DATA_DIR = originalRoot
  await db.$disconnect()
}
