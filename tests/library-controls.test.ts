import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterGames,
  librarySearch,
  librarySelection,
  discoverySearch,
  galleryFilters,
} from '../src/lib/gallery'
import { restoreGalleryPreferences } from '../src/lib/gallery-preferences'
import type { Game } from '../src/lib/types'

test('library discards retired URL filters and restores only supported preferences', () => {
  const old = {
    view: 'list',
    group: 'category',
    status: 'FINISHED',
    machine: 'pc',
    souvenir: true,
    owned: 'past',
    theme: '2',
    columns: 7,
  }
  for (const filters of [
    librarySearch.parse(old),
    restoreGalleryPreferences(JSON.stringify(old), {}, true),
  ]) {
    for (const key of ['view', 'group', 'status', 'machine', 'souvenir'])
      assert.equal(key in filters, false)
    assert.equal(filters.owned, undefined)
    assert.equal(filters.theme, '2')
    assert.equal(filters.columns, 7)
  }
})

test('library identifies exactly one top shortcut, including old owned links', () => {
  for (const [search, expected] of [
    [{}, 'library'],
    [{ scope: 'played' }, 'played'],
    [{ scope: 'discover' }, 'desire'],
    [{ scope: 'owned' }, 'owned'],
    [{ owned: 'current' }, 'owned'],
    [{ favorite: true }, 'favorites'],
    [{ scope: 'unassigned' }, 'sorting'],
  ] as const)
    assert.equal(librarySelection(librarySearch.parse(search)), expected)
  assert.equal(librarySearch.parse({ scope: 'discover', favorite: true }).scope, 'all')
})

const games = [
  { id: 'mickey', title: 'Epic Mickey', platform: { name: 'Wii' }, platformId: 'wii' },
  { id: 'zelda', title: 'ZÉLDA', platform: { name: 'Nintendo 64' }, platformId: 'n64' },
  {
    id: 'mario',
    title: 'Mario',
    platform: { name: 'Nintendo 64' },
    platformId: 'n64',
    developer: 'Mick',
  },
].map((game) => ({ updatedAt: '2026-10-22', genres: [], ...game }) as unknown as Game)

test('live library search matches inside titles without case or accents and respects the platform', () => {
  assert.deepEqual(
    filterGames(games, { q: 'mick' }, true).map((g) => g.id),
    ['mickey'],
  )
  assert.deepEqual(
    filterGames(games, { q: ' zel ' }, true).map((g) => g.id),
    ['zelda'],
  )
  assert.deepEqual(filterGames(games, { q: 'mick', platform: 'n64' }, true), [])
})

test('platform sort is alphabetical with title as tie-breaker', () => {
  assert.deepEqual(
    filterGames(games, { sort: 'platform' }).map((g) => g.id),
    ['mario', 'zelda', 'mickey'],
  )
})

test('discovery retires old filters while preserving theme and density from storage', () => {
  const old = {
    scope: 'played',
    owned: 'current',
    favorite: true,
    view: 'list',
    group: 'category',
    status: 'FINISHED',
    theme: '2',
    columns: 7,
    sort: 'desire',
  }
  for (const clean of [
    discoverySearch.parse(old),
    restoreGalleryPreferences(JSON.stringify(old), {}, 'discovery'),
  ]) {
    for (const key of ['scope', 'owned', 'favorite', 'view', 'group', 'status'])
      assert.equal(key in clean, false)
    assert.equal(clean.theme, '2')
    assert.equal(clean.columns, 7)
    const filters = galleryFilters({ ...clean, q: 'mick' }, 'discover', true)
    const candidates = games.map((g) => ({ ...g, discover: g.id === 'mickey' }))
    assert.deepEqual(
      filterGames(candidates, filters, true).map((g) => g.id),
      ['mickey'],
    )
  }
})
