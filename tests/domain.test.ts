import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { gameSchema, emptyGame, assertRealCollection } from '../src/lib/validation'
import { resolveMediaPath } from '../src/server/media-path'

test('Une envie et une collection rêvée ne nécessitent pas de possession ni de partie jouée', () => {
  const game = gameSchema.parse({
    ...emptyGame,
    title: 'Un jeu',
    platformId: 'amiga',
    discover: true,
    desire: 4.5,
    collectionIds: ['dream'],
  })
  assert.equal(game.experience.status, 'UNPLAYED')
  assert.deepEqual(game.possessions, [])
  assert.doesNotThrow(() => assertRealCollection(game.possessions, false))
  assert.throws(() => assertRealCollection(game.possessions, true))
  assert.doesNotThrow(() => assertRealCollection([{ format: 'DIGITAL', state: 'PAST' }], true))
})

test('Les notes sont facultatives et limitées à des demi-points', () => {
  const base = { ...emptyGame, title: 'Un jeu', platformId: 'pc' }
  assert.equal(gameSchema.parse(base).experience.rating, null)
  assert.equal(
    gameSchema.safeParse({ ...base, experience: { ...base.experience, rating: 5.5 } }).success,
    false,
  )
  assert.equal(gameSchema.safeParse({ ...base, desire: 3.2 }).success, false)
  assert.equal(
    gameSchema.parse({ ...base, experience: { ...base.experience, rating: 0 } }).experience.rating,
    0,
  )
})

test('Les chemins de médias restent dans la racine choisie, jamais absolus ou traversants', () => {
  const root = path.resolve('test-data')
  assert.equal(
    resolveMediaPath(root, 'games/covers/id.webp'),
    path.join(root, 'media', 'games', 'covers', 'id.webp'),
  )
  for (const invalid of [
    '../secret',
    '../../secret',
    '/etc/passwd',
    'C:/secret',
    '..\\secret',
    '',
  ]) {
    assert.throws(() => resolveMediaPath(root, invalid))
  }
  assert.throws(() => resolveMediaPath('', 'games/cover.webp'))
  assert.throws(() => resolveMediaPath('relative', 'games/cover.webp'))
})
