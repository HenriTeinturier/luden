import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterGames, gallerySearch, gameReturnSearch } from '../src/lib/gallery'
import type { Game } from '../src/lib/types'

test('Les vues plateforme distinguent expérience, découverte et possession', () => {
  const games = [null, 'UNPLAYED', 'PLAYED', 'PLAYING', 'FINISHED', 'ABANDONED'].map(
    (status, index) =>
      ({
        id: String(index),
        experience: status ? { status } : null,
        discover: index === 1 || index === 4,
        possessions: index === 0 ? [{ state: 'CURRENT' }] : [{ state: 'PAST' }],
        updatedAt: '2026-09-26',
      }) as Game,
  )
  const ids = (scope: 'played' | 'discover' | 'owned' | 'all') =>
    filterGames(games, { scope }).map((g) => g.id)
  assert.deepEqual(ids('played'), ['2', '3', '4', '5'])
  assert.deepEqual(ids('discover'), ['1', '4'])
  assert.deepEqual(ids('owned'), ['0'])
  assert.equal(ids('all').length, 6)
  assert.equal(filterGames(games, {}).length, 6)
})

test('Le tri aléatoire conserve les jeux, sans mutation, et reste stable jusqu’au remélange', () => {
  const games = Array.from({ length: 100 }, (_, index) => ({ id: `game-${index}` }) as Game)
  const originalIds = games.map((game) => game.id)
  const filters = { sort: 'random' as const, randomSeed: 12345 }
  const shuffled = filterGames(games, filters).map((game) => game.id)
  assert.deepEqual(new Set(shuffled), new Set(originalIds))
  assert.deepEqual(
    games.map((game) => game.id),
    originalIds,
  )
  assert.notDeepEqual(shuffled, originalIds)
  assert.deepEqual(
    filterGames([...games].reverse(), filters).map((game) => game.id),
    shuffled,
  )
  assert.notDeepEqual(
    filterGames(games, { ...filters, randomSeed: 54321 }).map((game) => game.id),
    shuffled,
  )
  assert.deepEqual(filterGames([], filters), [])
  assert.deepEqual(filterGames([games[0]], filters), [games[0]])
})

test('Filtrer ou modifier un jeu conserve l’ordre aléatoire relatif', () => {
  const games = Array.from(
    { length: 40 },
    (_, index) =>
      ({
        id: `game-${index}`,
        favorite: index % 2 === 0,
        updatedAt: '2026-10-09',
      }) as Game,
  )
  const filters = { sort: 'random' as const, randomSeed: 42 }
  const shuffled = filterGames(games, filters)
  assert.deepEqual(
    filterGames(games, { ...filters, favorite: true }),
    shuffled.filter((game) => game.favorite),
  )
  assert.deepEqual(
    filterGames(games.map((game) => ({ ...game, updatedAt: '2026-10-10' })).reverse(), filters).map(
      (game) => game.id,
    ),
    shuffled.map((game) => game.id),
  )
})

test('Les liens de fiche conservent le mélange ; une graine absente ou invalide reste stable', () => {
  const filters = gallerySearch.parse({ sort: 'random', randomSeed: 0xffffffff })
  assert.deepEqual(gameReturnSearch.parse({ from: 'library', filters }).filters, filters)
  const games = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as Game[]
  const defaultOrder = filterGames(games, { sort: 'random' })
  for (const randomSeed of [undefined, -1, 1.5, 0x100000000, 'invalide']) {
    assert.deepEqual(
      filterGames(games, gallerySearch.parse({ sort: 'random', randomSeed })),
      defaultOrder,
    )
  }
})
