import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterGames,
  gallerySearch,
  gameReturnSearch,
  galleryFilters,
  toggleGalleryScope,
} from '../src/lib/gallery'
import type { Game } from '../src/lib/types'

test('Les envies décroissantes gardent zéro avant les notes absentes et respectent la possession', () => {
  const games = [null, 0, 4.5, 2, 5].map(
    (desire, index) =>
      ({
        id: String(index),
        desire,
        discover: index !== 4,
        possessions: index === 3 ? [] : [{ state: 'CURRENT' }],
      }) as Game,
  )
  const filters = { scope: 'discover' as const, sort: 'desire' as const, owned: 'current' as const }
  assert.deepEqual(
    filterGames(games, filters).map((game) => game.id),
    ['2', '1', '0'],
  )
  const updated = games.map((game) => (game.id === '1' ? { ...game, desire: 5 } : game))
  assert.deepEqual(
    filterGames(updated, filters).map((game) => game.id),
    ['1', '2', '0'],
  )
})

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

test('Les vues reviennent à Joués sans modifier les filtres cumulables', () => {
  assert.equal(galleryFilters({}).scope, 'played')
  const base = galleryFilters({ owned: 'current', favorite: true, q: 'Mario', sort: 'title' })
  for (const scope of ['played', 'discover', 'all'] as const) {
    const selected = toggleGalleryScope(base, scope)
    assert.equal(selected.scope, scope)
    assert.equal(selected.owned, 'current')
    assert.equal(selected.favorite, true)
    assert.equal(selected.q, 'Mario')
    assert.equal(selected.sort, 'title')
    assert.equal(toggleGalleryScope(selected, scope).scope, 'played')
  }
})

test('Les anciennes vues Possédés deviennent Tous avec le filtre de possession', () => {
  assert.deepEqual(galleryFilters({ scope: 'owned', favorite: true }), {
    scope: 'all',
    owned: 'current',
    favorite: true,
  })
  assert.deepEqual(galleryFilters({ scope: 'owned', favorite: true }, 'discover', true), {
    scope: 'discover',
    owned: 'current',
    favorite: false,
  })
})

test('Possédés et Megastar se cumulent dans chaque vue ; Tous inclut les jeux sans expérience ni envie', () => {
  const games = [
    {
      id: 'played',
      experience: { status: 'PLAYED' },
      discover: false,
      favorite: true,
      possessions: [{ state: 'CURRENT' }],
    },
    {
      id: 'discover',
      experience: null,
      discover: true,
      favorite: true,
      possessions: [{ state: 'CURRENT' }],
    },
    {
      id: 'neither',
      experience: null,
      discover: false,
      favorite: true,
      possessions: [{ state: 'CURRENT' }],
    },
    { id: 'unowned', experience: null, discover: true, favorite: true, possessions: [] },
    {
      id: 'not-favorite',
      experience: null,
      discover: true,
      favorite: false,
      possessions: [{ state: 'CURRENT' }],
    },
  ] as Game[]
  const base = { owned: 'current' as const, favorite: true, sort: 'title' as const }
  // Use identical timestamps to keep fixture insertion order.
  const fixtures = games.map((game) => ({ ...game, updatedAt: '2026-10-21' }))
  const ids = (scope: 'played' | 'discover' | 'all') =>
    filterGames(fixtures, { ...base, sort: 'recent', scope }).map((game) => game.id)
  assert.deepEqual(ids('played'), ['played'])
  assert.deepEqual(ids('discover'), ['discover'])
  assert.deepEqual(ids('all'), ['played', 'discover', 'neither'])
  assert.deepEqual(
    filterGames(fixtures, { scope: 'discover', favorite: true }).map((game) => game.id),
    ['discover', 'unowned'],
  )
})
