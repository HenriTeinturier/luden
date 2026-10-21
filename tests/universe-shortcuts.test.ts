import { test } from 'node:test'
import assert from 'node:assert/strict'
import { universeShortcuts, updateUniverseActivity } from '../src/lib/universe-shortcuts'

test('Les cinq plus grands univers et les deux derniers actifs sans doublons', () => {
  const platforms = Array.from({ length: 8 }, (_, i) => ({ id: String(i), name: String(i) }))
  const games = platforms.flatMap((p, i) =>
    Array.from({ length: 8 - i }, (_, n) => ({
      id: `${i}-${n}`,
      platformId: p.id,
      updatedAt: '2026-01-01T00:00:00Z',
    })),
  )
  const now = Date.parse('2026-10-21T00:00:00Z')
  assert.deepEqual(
    universeShortcuts(platforms, games, { '6': now, '7': now + 1 }).map((p) => p.id),
    ['0', '1', '2', '3', '4', '7', '6'],
  )
  assert.deepEqual(
    universeShortcuts(platforms, games, { '0': now, '7': now + 1 }).map((p) => p.id),
    ['0', '1', '2', '3', '4', '7'],
  )
})

test('Suppression du dernier jeu et changement de plateforme restent une activité', () => {
  const before = { games: { deleted: 'amiga', moved: 'snes' }, changed: {} }
  const games = [{ id: 'moved', platformId: 'n64', updatedAt: '2026-10-21T00:00:00Z' }]
  const now = Date.parse('2026-10-22T00:00:00Z')
  const result = updateUniverseActivity(games, before, now)
  assert.equal(result.changed.amiga, now)
  assert.equal(result.changed.snes, now)
  assert.equal(updateUniverseActivity(games, result, now + 100).changed.amiga, now)
})
