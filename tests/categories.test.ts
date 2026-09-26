import { test } from 'node:test'
import assert from 'node:assert/strict'
import { categoriesSchema, groupByCategory } from '../src/lib/categories'
import { emptyGame, gameSchema } from '../src/lib/validation'

test('Les sections suivent l’ordre personnel sans dupliquer les jeux ni perdre les non-classés', () => {
  const games = [
    { id: '1', categoryId: 'sport' },
    { id: '2', categoryId: null },
    { id: '3', categoryId: 'rpg' },
    { id: '4', categoryId: 'sport' },
  ]
  const groups = groupByCategory(games, [
    { id: 'rpg', name: 'Aventure / rôle' },
    { id: 'sport', name: 'Sport / courses' },
    { id: 'empty', name: 'Combat' },
  ])
  assert.deepEqual(
    groups.map((g) => [g.name, g.games.map((game) => game.id)]),
    [
      ['Aventure / rôle', ['3']],
      ['Sport / courses', ['1', '4']],
      ['À classer', ['2']],
    ],
  )
  assert.deepEqual(groupByCategory([], []), [])
})

test('Les catégories sont uniques et facultatives, indépendantes des genres', () => {
  assert.equal(categoriesSchema.safeParse([{ name: 'Sport' }, { name: ' sport ' }]).success, false)
  assert.equal(
    categoriesSchema.safeParse([
      { id: 'a', name: 'Sport' },
      { id: 'a', name: 'RPG' },
    ]).success,
    false,
  )
  const game = gameSchema.parse({
    ...emptyGame,
    title: 'Mario',
    platformId: 'snes',
    genres: ['Platform'],
  })
  assert.equal(game.categoryId, null)
  assert.deepEqual(game.genres, ['Platform'])
})
