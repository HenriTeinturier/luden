import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cropGeometry,
  defaultPresentation,
  presentationSchema,
  retainVisuals,
} from '../src/lib/game-visuals'
import { quickGameSchema } from '../src/lib/validation'

test('Les visuels restent attachés à leur fiche, et le retrait du fond remet le cadre à zéro', () => {
  const value = {
    ...defaultPresentation(),
    box: 'cover',
    logo: 'logo',
    background: 'bg',
    sidebarCrop: { x: 18, y: 75, zoom: 2 },
  }
  assert.deepEqual(retainVisuals(value, ['cover', 'logo', 'bg']), value)
  const removed = retainVisuals(value, ['cover'])
  assert.equal(removed.box, 'cover')
  assert.equal(removed.logo, null)
  assert.equal(removed.background, null)
  assert.deepEqual(removed.sidebarCrop, { x: 50, y: 50, zoom: 1 })
  assert.deepEqual(retainVisuals({}, []), defaultPresentation())
  assert.equal(
    presentationSchema.safeParse({ sidebarCrop: { x: 110, y: 50, zoom: 1 } }).success,
    false,
  )
})

test('Le cadrage couvre toujours le panneau, même aux limites et pour un fond vertical', () => {
  for (const [iw, ih] of [
    [2560, 1440],
    [600, 1400],
  ]) {
    for (const x of [0, 50, 100])
      for (const y of [0, 50, 100])
        for (const zoom of [1, 3]) {
          const box = cropGeometry(480, 400, iw, ih, { x, y, zoom })
          assert.ok(box.left <= 0 && box.top <= 0)
          assert.ok(box.left + box.width >= 480 - 0.001)
          assert.ok(box.top + box.height >= 400 - 0.001)
          assert.ok(Math.abs(box.width / box.height - iw / ih) < 0.001)
        }
  }
})

test('Les actions rapides acceptent les demi-notes et refusent les champs de fiche complète', () => {
  assert.deepEqual(quickGameSchema.parse({ id: 'game', rating: null }), {
    id: 'game',
    rating: null,
  })
  assert.equal(quickGameSchema.safeParse({ id: 'game', rating: 4.5 }).success, true)
  assert.equal(quickGameSchema.safeParse({ id: 'game', rating: 4.2 }).success, false)
  assert.equal(quickGameSchema.safeParse({ id: 'game', memory: '' }).success, false)
})
