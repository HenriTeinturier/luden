import assert from 'node:assert/strict'
import test from 'node:test'
import { platforms } from '../src/lib/platforms'
import {
  coverFormat,
  platformPresentation,
  platformScenePresentation,
  presentationPresets,
  resolvePresentation,
  sceneStyle,
} from '../src/lib/presentation'

test('catalogue cover formats stay compatible, including unstyled platforms', () => {
  const ratios: Record<string, string> = {
    megadrive: '2 / 3',
    amstrad: '3 / 4',
    snes: '1.42',
    n64: '1.42',
    gba: '1.42',
    ps1: '1',
    dreamcast: '1',
    ds: '1',
    gameboy: '0.8',
    psp: '0.59',
    '3ds': '1',
    switch: '0.62',
    'switch-2': '0.62',
  }
  for (const platform of platforms) {
    assert.deepEqual(
      coverFormat(platform.id),
      {
        ratio: ratios[platform.id] ?? '0.71',
        wide: ['snes', 'n64', 'gba'].includes(platform.id),
      },
      platform.id,
    )
  }
  // Dreamcast PAL uses its wider frame only in its gallery, with an image.
  assert.equal(platformPresentation('dreamcast').gallery.imageRatio, '1.24')
  assert.equal(platformPresentation('switch').gallery.appearance, 'legacy')
})

test('handheld models are reusable and keep small supports in both scene sizes', () => {
  for (const [id, name] of [
    ['gameboy', 'Game Boy'],
    ['psp', 'PSP'],
    ['ds', 'Nintendo DS'],
  ]) {
    const presentation = platformPresentation(id)
    assert.equal(presentation.gallery.appearance, 'framed')
    assert.ok(presentationPresets[presentation.preset].label.includes(name))
    assert.deepEqual(resolvePresentation({ preset: presentation.preset }), presentation)
    assert.deepEqual(platformScenePresentation(id), presentation)
    assert.ok(presentation.scene.supportWidth < presentation.scene.pairedBoxWidth / 1.5)
    assert.ok(presentation.scene.fullSupportWidth < presentation.scene.fullBoxWidth / 1.5)
    const custom = { id, customization: { preset: 'dvd-case' as const } }
    assert.equal(platformPresentation(custom).preset, 'dvd-case')
    assert.equal(platformScenePresentation(custom).preset, 'dvd-case')
  }
  assert.equal(presentationPresets[platformPresentation('psp').preset].support, 'umd')
  assert.equal(presentationPresets[platformPresentation('ds').preset].support, 'card')
})

test('recent scene adjustments and full-view support sizes survive the refactor', () => {
  const dreamcast = platformPresentation('dreamcast').scene
  assert.equal(dreamcast.marginBottom + dreamcast.objectsBottom, 20)
  assert.equal(dreamcast.supportHeight, 80)
  assert.equal(sceneStyle(dreamcast)['--scene-support-y'], 'calc(16px - 20%)')
  const n64 = platformPresentation('n64').scene
  assert.equal(n64.objectsScale, 0.8)
  assert.equal(n64.pairedBoxOffsetX, '-11.5cqw')
  assert.equal(n64.supportOffsetX, '11.5cqw')
  assert.equal(n64.fullBoxWidth, 74)
  const xbox = platformPresentation('xbox').scene
  const ps2 = platformPresentation('ps2').scene
  assert.equal(xbox.objectsBottom, ps2.objectsBottom - 42)
  assert.equal(xbox.marginBottom, ps2.marginBottom + 42)
  const mini = platformPresentation('gamecube').scene
  assert.ok(mini.supportHeight < ps2.supportHeight)
  assert.ok(mini.fullSupportWidth < ps2.fullSupportWidth)
  assert.equal(platformPresentation('amiga').scene.boxHeight, 128.8)
})

test('models can be reused without platform identity and adjustments are isolated', () => {
  const personal = resolvePresentation({ preset: 'dvd-case', scene: { supportWidth: 40 } })
  assert.equal(personal.scene.supportWidth, 40)
  assert.equal(resolvePresentation({ preset: 'dvd-case' }).scene.supportWidth, 44)
  assert.equal(platformPresentation('ps2').scene.supportWidth, 44)
  assert.deepEqual(platformPresentation('unknown'), resolvePresentation({ preset: 'standard' }))
  assert.equal(resolvePresentation({ preset: 'landscape-box' }).scene.fullBoxWidth, 78)
})

test('collection and scene choices stay independent while old settings keep their exact geometry', () => {
  const platform = {
    id: 'xbox',
    customization: { preset: 'slim-case' as const, scenePreset: 'original' as const },
  }
  assert.equal(coverFormat(platform).ratio, '0.62')
  assert.deepEqual(platformScenePresentation(platform), platformPresentation('xbox'))
  const custom = {
    ...platform,
    customization: { ...platform.customization, scenePreset: 'landscape-cartridge' as const },
  }
  assert.equal(coverFormat(custom).ratio, '0.62')
  assert.equal(platformScenePresentation(custom).gallery.wide, true)
  assert.equal(platformScenePresentation(custom).scene.supportOffsetX, '11.5cqw')
  for (const id of ['xbox', 'n64', 'dreamcast', 'unknown']) {
    assert.deepEqual(platformScenePresentation(id), platformPresentation(id))
    for (const preset of [null, 'dvd-case', 'landscape-box'] as const) {
      const previous = { id, customization: { preset } }
      assert.deepEqual(platformScenePresentation(previous), platformPresentation(previous))
      assert.deepEqual(
        platformScenePresentation({ ...previous, customization: { preset, scenePreset: null } }),
        platformPresentation(previous),
      )
    }
  }
})
