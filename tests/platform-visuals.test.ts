import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  platformVisualsSchema,
  activePlatformVisuals,
  withoutPlatformVisual,
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

test('Supprimer un visuel préserve le brouillon et remplace seulement un défaut manquant', () => {
  const all = [
    visual('default', { isDefault: true }),
    visual('inactive', { active: false }),
    visual('next', { caption: 'Nom non enregistré' }),
    visual('banner', { kind: 'BANNER', isDefault: true }),
  ]
  const remaining = withoutPlatformVisual(all, 'default')
  assert.equal(remaining.find((v) => v.id === 'next')?.isDefault, true)
  assert.equal(remaining.find((v) => v.id === 'next')?.caption, 'Nom non enregistré')
  assert.equal(remaining.find((v) => v.id === 'inactive')?.active, false)
  assert.equal(remaining.find((v) => v.id === 'banner')?.isDefault, true)
  assert.equal(all.find((v) => v.id === 'next')?.isDefault, false)
  assert.deepEqual(withoutPlatformVisual([all[0]], 'default'), [])
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
