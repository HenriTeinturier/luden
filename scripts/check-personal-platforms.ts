// Focused service checks with temporary records and files; no personal data is modified.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { access, mkdtemp, rmdir, unlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import { createPlatform, deletePersonalPlatform } from '../src/server/platforms'
import { savePlatformImage, savePlatformVisuals } from '../src/server/platform-visuals'
import { loadLibrary, saveGame, exportLibrary } from '../src/server/library'
import { searchGames } from '../src/server/igdb'
import { resolveMediaPath } from '../src/server/media-path'
import { readPlatformCustomization } from '../src/lib/platform-customization'
import { emptyGame } from '../src/lib/validation'

const originalRoot = process.env.LUDEN_DATA_DIR
const originalFetch = globalThis.fetch
const originalClient = process.env.IGDB_CLIENT_ID
const originalSecret = process.env.IGDB_CLIENT_SECRET
const root = await mkdtemp(path.join(os.tmpdir(), 'luden-personal-platform-'))
process.env.LUDEN_DATA_DIR = root
const requestId = randomUUID()
const platformId = `custom-${requestId}`
const otherOwner = `fixture-${randomUUID()}`
const otherPlatform = `custom-${randomUUID()}`
const gameIds: string[] = []
try {
  const input = {
    requestId,
    name: 'Fixture PC 1998',
    categories: ['COMPUTER'],
    catalogPlatformId: 'pc',
    dateLabel: '1998–2002',
  }
  const results = await Promise.all([createPlatform(input), createPlatform(input)])
  assert.deepEqual(results, [{ platformId }, { platformId }])
  const draft = await db.platform.findUniqueOrThrow({ where: { id: platformId } })
  assert.equal(draft.ownerId, ownerId)
  assert.equal(draft.isDraft, true)
  assert.equal(draft.catalogPlatformId, 'pc')
  let library = await loadLibrary()
  assert.equal(
    library.platforms.some((p) => p.id === platformId),
    false,
  )
  assert.equal(
    library.platformDrafts.some((p) => p.id === platformId),
    true,
  )
  await assert.rejects(saveGame({ ...emptyGame, title: 'Fixture', platformId }))
  await assert.rejects(searchGames('Fixture', platformId))

  await db.profile.create({ data: { id: otherOwner, name: 'Fixture isolation' } })
  await db.platform.create({
    data: {
      id: otherPlatform,
      ownerId: otherOwner,
      name: 'Fixture privée',
      shortName: 'Fixture',
      era: '',
      color: '#000000',
      family: 'Test',
    },
  })
  library = await loadLibrary()
  assert.equal(
    library.platforms.some((p) => p.id === otherPlatform),
    false,
  )
  await assert.rejects(savePlatformVisuals({ platformId: otherPlatform, visuals: [] }))
  await assert.rejects(saveGame({ ...emptyGame, title: 'Fixture', platformId: otherPlatform }))
  await assert.rejects(deletePersonalPlatform(otherPlatform))
  await assert.rejects(deletePersonalPlatform('pc'))
  await assert.rejects(
    savePlatformVisuals({ platformId, visuals: [], catalogPlatformId: otherPlatform }),
  )

  const bytes = await sharp({
    create: { width: 32, height: 16, channels: 4, background: '#12345680' },
  })
    .png()
    .toBuffer()
  const image = await savePlatformImage(platformId, 'LOGO', bytes, 'Fixture')
  const config = readPlatformCustomization({
    ...readPlatformCustomization(draft.customization),
    title: 'Fixture PC 1999',
    family: 'Test',
    preset: 'jewel-case',
  })
  // A stale list cannot publish the draft, even when identity/catalogue changes were submitted.
  await assert.rejects(
    savePlatformVisuals({ platformId, visuals: [], publish: true, customization: config }),
  )
  assert.equal((await db.platform.findUniqueOrThrow({ where: { id: platformId } })).isDraft, true)
  await savePlatformVisuals({
    platformId,
    visuals: [{ ...image, active: true, isDefault: true }],
    customization: config,
    catalogPlatformId: 'pc',
    publish: true,
  })
  library = await loadLibrary()
  const published = library.platforms.find((p) => p.id === platformId)!
  assert.equal(published.name, 'Fixture PC 1999')
  assert.equal(published.customization.preset, 'jewel-case')
  assert.equal(
    library.platformDrafts.some((p) => p.id === platformId),
    false,
  )
  await createPlatform(input)
  assert.equal((await db.platform.findUniqueOrThrow({ where: { id: platformId } })).isDraft, false)

  // Stub the provider, assert the real search service keeps the personal destination and PC year.
  process.env.IGDB_CLIENT_ID = 'fixture'
  process.env.IGDB_CLIENT_SECRET = 'fixture'
  const bodies: string[] = []
  globalThis.fetch = async (url, options) => {
    if (String(url) === 'https://id.twitch.tv/oauth2/token')
      return Response.json({ access_token: 'fixture', expires_in: 3600 })
    assert.equal(String(url), 'https://api.igdb.com/v4/games')
    bodies.push(String(options?.body))
    return Response.json([
      {
        id: 123,
        name: 'Fixture',
        platforms: [
          { id: 6, name: 'PC' },
          { id: 8, name: 'PS2' },
        ],
        release_dates: [
          { platform: 8, y: 2001 },
          { platform: 6, y: 1998 },
        ],
      },
    ])
  }
  const [result] = await searchGames('Fixture', platformId)
  assert.ok(bodies[0].includes('where platforms = (6);'))
  assert.equal(result.suggestedPlatformId, platformId)
  assert.equal(result.releaseYear, 1998)
  const game = await saveGame({
    ...emptyGame,
    title: 'Fixture personnalisée',
    platformId,
    releaseYear: result.releaseYear,
    igdbId: result.igdbId,
  })
  gameIds.push(game.id)
  assert.equal((await db.game.findUniqueOrThrow({ where: { id: game.id } })).platformId, platformId)
  await assert.rejects(deletePersonalPlatform(platformId), /jeux de cette plateforme/)

  const exported = await exportLibrary()
  assert.equal(exported.version, 8)
  assert.equal(exported.platforms.find((p) => p.id === platformId)?.catalogPlatformId, 'pc')
  assert.equal(
    exported.platforms.some((p) => p.id === otherPlatform),
    false,
  )
  const storedImage = await db.platformVisual.findUniqueOrThrow({ where: { id: image.id } })
  await db.game.delete({ where: { id: game.id } })
  assert.equal((await deletePersonalPlatform(platformId)).warning, null)
  assert.equal(await db.platform.findUnique({ where: { id: platformId } }), null)
  await assert.rejects(access(resolveMediaPath(root, storedImage.path)))
  console.log(
    'Plateformes personnelles : brouillon, publication atomique, isolation, catalogue PC, jeux indépendants, export et suppression vérifiés.',
  )
} finally {
  globalThis.fetch = originalFetch
  if (originalClient === undefined) delete process.env.IGDB_CLIENT_ID
  else process.env.IGDB_CLIENT_ID = originalClient
  if (originalSecret === undefined) delete process.env.IGDB_CLIENT_SECRET
  else process.env.IGDB_CLIENT_SECRET = originalSecret
  await db.game.deleteMany({ where: { id: { in: gameIds }, ownerId } })
  const images = await db.platformVisual.findMany({ where: { platformId } })
  await db.platform.deleteMany({ where: { id: platformId, ownerId } })
  await db.profile.deleteMany({ where: { id: otherOwner } })
  for (const image of images)
    await unlink(resolveMediaPath(root, image.path)).catch(() => undefined)
  for (const folder of [
    'media/plateformes/' + platformId + '/logo',
    'media/plateformes/' + platformId,
    'media/plateformes',
    'media',
  ])
    await rmdir(path.join(root, folder)).catch(() => undefined)
  await rmdir(root)
  if (originalRoot === undefined) delete process.env.LUDEN_DATA_DIR
  else process.env.LUDEN_DATA_DIR = originalRoot
  await db.$disconnect()
}
