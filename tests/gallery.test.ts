import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterGames } from '../src/lib/gallery'
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
