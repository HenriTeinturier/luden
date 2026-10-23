import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  alternativePlatforms,
  belongsToPlatform,
  gamePlatformIds,
  hasVersionHistory,
} from '../src/lib/wish-platforms'
import { filterGames, galleryCounts, type GallerySearch } from '../src/lib/gallery'
import { updateUniverseActivity, universeShortcuts } from '../src/lib/universe-shortcuts'
import { selectHomePlatforms, defaultHomePlatforms } from '../src/lib/home-platforms'
import { gameSchema, emptyGame } from '../src/lib/validation'
import type { Game } from '../src/lib/types'

const game = {
  id: 'wish',
  title: 'Elden Ring',
  platformId: 'ps5',
  alternativePlatformIds: ['pc'],
  discover: true,
  desire: 4.5,
  souvenir: false,
  favorite: false,
  experience: { status: 'UNPLAYED', rating: null, memory: '', period: '' },
  possessions: [],
  entries: [],
  updatedAt: '2026-10-23T00:00:00Z',
} as unknown as Game

test('Une seule envie générale apparaît dans deux univers, sans doublon de compteur', () => {
  assert.deepEqual(gamePlatformIds(game), ['ps5', 'pc'])
  assert.equal(filterGames([game], { scope: 'discover' }).length, 1)
  for (const platform of ['ps5', 'pc']) {
    assert.equal(filterGames([game], { platform, scope: 'discover' }).length, 1)
    assert.equal(filterGames([game], { scope: 'discover' }, true, platform).length, 1)
    assert.equal(galleryCounts([game], platform).desire, 1)
  }
  assert.equal(galleryCounts([game]).library, 1)
  assert.equal(galleryCounts([game]).desire, 1)
  assert.equal(belongsToPlatform(game, 'snes'), false)
})

test('Parties, notes, possessions et favoris ne se propagent pas aux alternatives', () => {
  const played = {
    ...game,
    favorite: true,
    souvenir: true,
    experience: {
      ...game.experience!,
      status: 'FINISHED' as const,
      rating: 5,
      memory: 'PS5 seulement',
    },
    possessions: [
      { id: 'copy', state: 'CURRENT', format: 'PHYSICAL', gameId: game.id, store: '' } as const,
    ],
  }
  for (const filters of [
    { scope: 'played' },
    { scope: 'owned' },
    { owned: 'current' },
    { owned: 'past' },
    { owned: 'none' },
    { status: 'FINISHED' },
    { favorite: true },
    { souvenir: true },
  ] as GallerySearch[]) {
    assert.equal(filterGames([played], { ...filters, platform: 'pc' }).length, 0)
    assert.equal(filterGames([played], filters, true, 'pc').length, 0)
  }
  assert.equal(filterGames([played], { scope: 'played' }, true, 'ps5').length, 1)
  assert.deepEqual(galleryCounts([played], 'pc'), {
    library: 1,
    desire: 1,
    played: 0,
    owned: 0,
    favorites: 0,
    sorting: 0,
  })
  assert.equal(galleryCounts([played], 'ps5').owned, 1)
  assert.equal(played.experience.memory, 'PS5 seulement')
})

test('Retirer des envies masque les alternatives et les réactiver restaure les choix', () => {
  const inactive = { ...game, discover: false }
  assert.deepEqual(gamePlatformIds(inactive), ['ps5'])
  assert.equal(filterGames([inactive], { platform: 'pc' }).length, 0)
  assert.equal(galleryCounts([inactive], 'pc').library, 0)
  assert.deepEqual(gamePlatformIds({ ...inactive, discover: true }), ['ps5', 'pc'])
  assert.deepEqual(alternativePlatforms('pc', ['ps5', 'pc', 'ps5']), ['ps5'])
})

test('Une note d’envie modifiée reste commune à toutes les vues', () => {
  const updated = { ...game, desire: 2 }
  assert.equal(filterGames([updated], { platform: 'pc' })[0].desire, 2)
  assert.equal(filterGames([updated], { platform: 'ps5' })[0].desire, 2)
})

test('L’historique empêche de réattribuer une ancienne partie ou possession', () => {
  assert.equal(hasVersionHistory(game), false)
  for (const patch of [
    { experience: { ...game.experience!, rating: 0 } },
    { experience: { ...game.experience!, memory: 'Un souvenir' } },
    { experience: { ...game.experience!, status: 'PLAYED' as const } },
    { possessions: [{}] },
    { entries: [{}] },
    { souvenir: true },
  ])
    assert.equal(hasVersionHistory({ ...game, ...patch }), true)
})

test('Les plateformes secondaires participent aux raccourcis et à leur activité', () => {
  const platforms = ['ps5', 'pc'].map((id) => ({
    id,
    name: id,
    customization: { hiddenFromPlatforms: false },
  }))
  assert.equal(universeShortcuts(platforms, [game], {}).length, 2)
  assert.equal(selectHomePlatforms(platforms, [game], defaultHomePlatforms).length, 2)
  const before = updateUniverseActivity([game], null, 100)
  const after = updateUniverseActivity([{ ...game, discover: false }], before, 200)
  assert.equal(after.changed.pc, 200)
  assert.deepEqual(after.games.wish, ['ps5'])
})

test('Les anciens formulaires peuvent omettre les alternatives sans demander leur effacement', () => {
  const { alternativePlatformIds: omitted, ...legacy } = emptyGame
  assert.deepEqual(omitted, [])
  assert.equal(
    gameSchema.parse({ ...legacy, title: 'Test', platformId: 'ps5' }).alternativePlatformIds,
    undefined,
  )
  assert.equal(
    gameSchema.safeParse({
      ...legacy,
      title: 'Test',
      platformId: 'ps5',
      alternativePlatformIds: [''],
    }).success,
    false,
  )
})
