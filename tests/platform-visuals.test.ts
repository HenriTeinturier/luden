import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  platformVisualsSchema,
  activePlatformVisuals,
  type PlatformVisual,
} from '../src/lib/platform-visuals'

const visual = (id: string, patch: Partial<PlatformVisual> = {}): PlatformVisual => ({
  id,
  kind: 'POSTER',
  caption: id,
  active: true,
  isDefault: false,
  position: 0,
  width: 10,
  height: 20,
  url: `/platform-media/${id}`,
  ...patch,
})
test('Les visuels par défaut sont uniques et actifs, sans imposer une galerie non vide', () => {
  const parse = (visuals: PlatformVisual[]) =>
    platformVisualsSchema.safeParse({ platformId: 'snes', visuals }).success
  const a = visual('a', { isDefault: true })
  assert.equal(parse([a, visual('b')]), true)
  assert.equal(parse([a, visual('banner', { kind: 'BANNER', isDefault: true })]), true)
  assert.equal(parse([a, visual('b', { isDefault: true })]), false)
  assert.equal(parse([visual('a', { isDefault: true, active: false })]), false)
  assert.equal(parse([visual('a')]), false)
  assert.equal(parse([a, a]), false)
  assert.equal(parse([visual('a', { active: false })]), true)
  assert.equal(parse([]), true)
})
test('La galerie commence par le défaut et exclut les images inactives et les bandeaux', () => {
  const all = [
    visual('inactive', { active: false }),
    visual('later', { position: 3 }),
    visual('default', { isDefault: true, position: 2 }),
    visual('first', { position: 1 }),
    visual('banner', { kind: 'BANNER', isDefault: true }),
  ]
  assert.deepEqual(
    activePlatformVisuals(all, 'POSTER').map((v) => v.id),
    ['default', 'first', 'later'],
  )
  assert.equal(all.length, 5)
  assert.equal(all[0].id, 'inactive')
  assert.equal(
    platformVisualsSchema.safeParse({ platformId: '../snes', visuals: [] }).success,
    false,
  )
})
