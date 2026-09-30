// Focused DB verification. All fixtures and image files belong to this run only.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { mkdtemp, rmdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import { saveGame, quickUpdateGame, deleteGame } from '../src/server/library'
import { saveImage, removeUnusedImages } from '../src/server/media'
import { emptyGame } from '../src/lib/validation'
import { readPresentation, defaultPresentation } from '../src/lib/game-visuals'

const originalRoot = process.env.LUDEN_DATA_DIR
const root = await mkdtemp(path.join(os.tmpdir(), 'luden-presentation-'))
process.env.LUDEN_DATA_DIR = root
let gameId: string | undefined
let collectionId: string | undefined
let imageId: string | undefined
try {
  const image = await saveImage(
    await sharp({ create: { width: 2560, height: 1440, channels: 4, background: '#7451ae80' } })
      .png()
      .toBuffer(),
  )
  imageId = image.id
  const stored = await db.media.findUniqueOrThrow({ where: { id: image.id } })
  assert.equal(stored.width, 2560)
  assert.equal(stored.height, 1440)
  const collection = await db.collection.create({
    data: { name: 'Contrôle temporaire présentation', kind: 'REAL', ownerId },
  })
  collectionId = collection.id
  const input = {
    ...structuredClone(emptyGame),
    title: 'Contrôle temporaire présentation',
    platformId: 'snes',
    media: [
      { mediaId: image.id, category: 'BOX' as const, position: 0, caption: '', isPrimary: true },
    ],
    presentation: {
      ...defaultPresentation(),
      background: image.id,
      logo: image.id,
      sidebarCrop: { x: 27, y: 71, zoom: 1.8 },
    },
    experience: {
      status: 'PLAYED' as const,
      rating: 3.5,
      memory: 'Souvenir conservé',
      period: 'Une époque',
    },
    possessions: [{ format: 'PHYSICAL' as const, state: 'PAST' as const, store: '' }],
    collectionIds: [collection.id],
  }
  const created = await saveGame(input)
  gameId = created.id
  const before = await db.game.findUniqueOrThrow({
    where: { id: gameId },
    include: { experience: true, media: true, possessions: true, entries: true },
  })
  await quickUpdateGame({ id: gameId, rating: 4.5 })
  await quickUpdateGame({ id: gameId, favorite: true, discover: true, status: 'FINISHED' })
  const after = await db.game.findUniqueOrThrow({
    where: { id: gameId },
    include: { experience: true, media: true, possessions: true, entries: true },
  })
  assert.equal(after.experience?.rating, 4.5)
  assert.equal(after.experience?.status, 'FINISHED')
  assert.equal(after.experience?.memory, before.experience?.memory)
  assert.equal(after.experience?.period, before.experience?.period)
  assert.deepEqual(after.media, before.media)
  assert.deepEqual(after.possessions, before.possessions)
  assert.deepEqual(after.entries, before.entries)
  assert.deepEqual(after.presentation, before.presentation)
  await quickUpdateGame({ id: gameId, rating: null })
  assert.equal((await db.experience.findUniqueOrThrow({ where: { gameId } })).rating, null)
  // Older clients omit presentation; retain the crop when the referenced media is still present.
  await saveGame({ ...input, id: gameId, presentation: undefined, possessions: after.possessions })
  assert.deepEqual(
    readPresentation((await db.game.findUniqueOrThrow({ where: { id: gameId } })).presentation),
    input.presentation,
  )
  await saveGame({
    ...input,
    id: gameId,
    media: [],
    presentation: undefined,
    possessions: after.possessions,
  })
  assert.deepEqual(
    readPresentation((await db.game.findUniqueOrThrow({ where: { id: gameId } })).presentation),
    defaultPresentation(),
  )
  console.log('Présentation, cadrage, imports 2560 px et mutations partielles : OK.')
} finally {
  if (gameId) await deleteGame(gameId)
  if (collectionId) await db.collection.delete({ where: { id: collectionId } })
  if (imageId) await removeUnusedImages([imageId])
  // Non-recursive removal only: never touch an unexpected remaining file.
  await rmdir(path.join(root, 'media', 'images')).catch(() => undefined)
  await rmdir(path.join(root, 'media')).catch(() => undefined)
  await rmdir(root).catch(() => undefined)
  process.env.LUDEN_DATA_DIR = originalRoot
  await db.$disconnect()
}
