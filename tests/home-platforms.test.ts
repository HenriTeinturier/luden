import assert from 'node:assert/strict'
import test from 'node:test'
import {
  homePlatformWindow,
  homePlatformCapacity,
  parseHomePlatforms,
  selectHomePlatforms,
} from '../src/lib/home-platforms'

const platforms = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  name: `Plateforme ${i}`,
  customization: { hiddenFromPlatforms: i === 7 },
}))
const games = platforms.flatMap((p, i) => Array.from({ length: i }, () => ({ platformId: p.id })))

test('auto selects six visible platforms by descending game count without mutating the catalogue', () => {
  assert.deepEqual(
    selectHomePlatforms(platforms, games, { mode: 'auto', ids: [] }).map((p) => p.id),
    ['6', '5', '4', '3', '2', '1'],
  )
  assert.equal(platforms[0].id, '0')
})

test('manual preserves order and skips hidden, missing, empty and duplicate choices', () => {
  assert.deepEqual(
    selectHomePlatforms(platforms, games, {
      mode: 'manual',
      ids: ['3', '7', '', 'missing', '0', '3'],
    }).map((p) => p.id),
    ['3', '0'],
  )
  assert.deepEqual(selectHomePlatforms(platforms, games, { mode: 'manual', ids: [] }), [])
})

test('preferences tolerate invalid storage and preserve empty manual slots', () => {
  assert.deepEqual(parseHomePlatforms('{'), { mode: 'auto', ids: [] })
  assert.deepEqual(parseHomePlatforms('{"mode":"manual","ids":["3","",12]}'), {
    mode: 'manual',
    ids: ['3', ''],
  })
})

test('capacity follows available section width, including with a sidebar', () => {
  assert.equal(homePlatformCapacity(400), 1)
  assert.equal(homePlatformCapacity(650), 2)
  assert.equal(homePlatformCapacity(900), 4)
})

test('rotation fills the final group without duplicating a platform within that group', () => {
  assert.deepEqual(homePlatformWindow([0, 1, 2, 3, 4, 5], 4, 1), [4, 5, 0, 1])
  assert.deepEqual(homePlatformWindow([0, 1], 4, 0), [0, 1])
  assert.deepEqual(homePlatformWindow([], 4, 0), [])
})
