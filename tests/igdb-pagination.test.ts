import assert from 'node:assert/strict'
import test from 'node:test'
import { db } from '../src/server/db'
import { searchGames } from '../src/server/igdb'

test('IGDB : pages sans doublons, filtre conservé et dernière page détectée', async (t) => {
  const oldId = process.env.IGDB_CLIENT_ID
  const oldSecret = process.env.IGDB_CLIENT_SECRET
  process.env.IGDB_CLIENT_ID = 'test'
  process.env.IGDB_CLIENT_SECRET = 'test'
  t.after(() => {
    if (oldId === undefined) delete process.env.IGDB_CLIENT_ID
    else process.env.IGDB_CLIENT_ID = oldId
    if (oldSecret === undefined) delete process.env.IGDB_CLIENT_SECRET
    else process.env.IGDB_CLIENT_SECRET = oldSecret
  })
  const originalFind = db.platform.findFirstOrThrow
  const originalList = db.platform.findMany
  Object.assign(db.platform, {
    findFirstOrThrow: async () => ({ id: 'ps3', igdbId: 9 }),
    findMany: async () => [],
  })
  t.after(() =>
    Object.assign(db.platform, { findFirstOrThrow: originalFind, findMany: originalList }),
  )
  const catalogue = Array.from({ length: 16 }, (_, index) => ({
    id: index + 1,
    name: `Jeu ${index + 1}`,
  }))
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    if (url.includes('oauth2')) return Response.json({ access_token: 'test', expires_in: 3600 })
    const body = String(options.body)
    assert.match(body, /search "Zelda";/)
    assert.match(body, /where platforms = \(9\);/)
    assert.match(body, /limit 9;/)
    const offset = Number(body.match(/offset (\d+);/)![1])
    return Response.json(catalogue.slice(offset, offset + 9))
  })
  const first = await searchGames('Zelda', 'ps3')
  const second = await searchGames('Zelda', 'ps3', 2)
  assert.equal(first.page, 1)
  assert.equal(first.results.length, 8)
  assert.equal(first.hasNextPage, true)
  assert.equal(second.page, 2)
  assert.equal(second.results.length, 8)
  assert.equal(second.hasNextPage, false)
  assert.deepEqual(
    [...first.results, ...second.results].map((game) => game.igdbId),
    catalogue.map((game) => game.id),
  )
})
