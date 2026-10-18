import { test } from 'node:test'
import assert from 'node:assert/strict'
import { platformEditorSnapshot } from '../src/lib/platform-editor-state'
import { readPlatformCustomization } from '../src/lib/platform-customization'
import type { PlatformVisual } from '../src/lib/platform-visuals'

test('La protection des modifications couvre les réglages et les médias, sans dépendre des métadonnées serveur', () => {
  const image: PlatformVisual = {
    id: 'logo',
    kind: 'LOGO',
    caption: '',
    active: true,
    isDefault: true,
    position: 0,
    url: '/image',
    width: 100,
    height: 100,
  }
  const saved = {
    customization: readPlatformCustomization({}),
    catalogPlatformId: 'pc',
    slideshowEnabled: false,
    slideshowSeconds: 8,
    visuals: [image],
  }
  const baseline = platformEditorSnapshot(saved)
  for (const change of [
    { customization: { ...saved.customization, title: 'Mon PC' } },
    { customization: { ...saved.customization, scenePreset: 'original' as const } },
    { customization: { ...saved.customization, sidebarMode: 'composition' as const } },
    {
      customization: {
        ...saved.customization,
        card: { ...saved.customization.card, logoWidth: 25 },
      },
    },
    { catalogPlatformId: null },
    { slideshowSeconds: '' },
    { slideshowEnabled: true },
    { visuals: [{ ...image, active: false, isDefault: false }] },
    { visuals: [{ ...image, caption: 'Autre logo' }] },
    { visuals: [] },
  ])
    assert.notEqual(platformEditorSnapshot({ ...saved, ...change }), baseline)
  assert.equal(
    platformEditorSnapshot({
      ...saved,
      slideshowSeconds: '8',
      visuals: [{ ...image, url: '/updated', width: 200, position: 5 }],
    }),
    baseline,
  )
  const other = { ...image, id: 'other', isDefault: false }
  assert.notEqual(
    platformEditorSnapshot({ ...saved, visuals: [image, other] }),
    platformEditorSnapshot({ ...saved, visuals: [other, image] }),
  )
  assert.equal(
    platformEditorSnapshot({
      ...saved,
      customization: {
        ...saved.customization,
        categories: ['CONSOLE', 'HANDHELD'],
        hiddenAssets: ['LOGO', 'HARDWARE'],
      },
    }),
    platformEditorSnapshot({
      ...saved,
      customization: {
        ...saved.customization,
        categories: ['HANDHELD', 'CONSOLE'],
        hiddenAssets: ['HARDWARE', 'LOGO'],
      },
    }),
  )
})
