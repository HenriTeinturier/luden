import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesPlatformFilter, platforms } from '../src/lib/platforms'

test('platform filters separate handhelds and computers while sharing hybrids', () => {
  const ids = (filter: string) =>
    platforms.filter((p) => matchesPlatformFilter(p, filter)).map((p) => p.id)
  assert.deepEqual(ids('Portables').sort(), [
    '3ds',
    'ds',
    'gameboy',
    'gba',
    'psp',
    'switch',
    'switch-2',
  ])
  for (const id of ['switch', 'switch-2']) assert.ok(ids('Consoles').includes(id))
  for (const id of ['gameboy', 'gba', 'ds', '3ds', 'psp', 'pc', 'amiga'])
    assert.ok(!ids('Consoles').includes(id))
  assert.ok(ids('Consoles').includes('dreamcast'))
  assert.ok(ids('PlayStation').includes('psp'))
  assert.deepEqual(ids('NEC').sort(), ['pc-engine', 'pc-engine-cd'])
  for (const id of ids('NEC')) {
    assert.ok(ids('Consoles').includes(id))
    assert.ok(!ids('Portables').includes(id))
    assert.ok(!ids('Ordinateurs').includes(id))
  }
  assert.equal(ids('Toutes').length, platforms.length)
})
