import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  customizePlatform,
  platformCustomizationSchema,
  readPlatformCustomization,
} from '../src/lib/platform-customization'
import { platformArtwork } from '../src/lib/platform-artwork'
import { platformPresentation } from '../src/lib/presentation'
import { platformVisualsSchema, type PlatformVisual } from '../src/lib/platform-visuals'

const image = (kind: PlatformVisual['kind'], id = kind): PlatformVisual => ({
  id,
  kind,
  caption: '',
  active: true,
  isDefault: true,
  position: 0,
  width: 100,
  height: 100,
  url: `/platform-media/${id}`,
})

test('Personnaliser une plateforme conserve son identité catalogue et sa présentation d’origine par défaut', () => {
  const catalog = { id: 'xbox', name: 'Xbox', shortName: 'Xbox', customization: {} }
  const original = customizePlatform(catalog)
  assert.equal(original.name, 'Xbox')
  assert.deepEqual(platformPresentation(original), platformPresentation('xbox'))
  const custom = customizePlatform({
    ...catalog,
    customization: { title: 'Ma Xbox', dateLabel: '2002–2008', preset: 'jewel-case' },
  })
  assert.equal(custom.name, 'Ma Xbox')
  assert.equal(custom.catalogName, 'Xbox')
  assert.equal(custom.id, 'xbox')
  assert.equal(platformPresentation(custom).preset, 'jewel-case')
  assert.equal(platformPresentation(custom).gallery.ratio, '1')
})

test('Les variantes sidebar héritent de la carte, se remplacent et se masquent indépendamment', () => {
  const defaults = readPlatformCustomization({})
  const logo = image('LOGO')
  const sidebar = image('SIDEBAR_LOGO')
  assert.equal(platformArtwork('dreamcast', defaults, []).customCard, false)
  assert.equal(platformArtwork('dreamcast', defaults, []).logo, '/platforms/dreamcast/logo.webp')
  assert.equal(platformArtwork('dreamcast', defaults, [logo]).sidebarLogo, logo.url)
  assert.equal(platformArtwork('dreamcast', defaults, [logo, sidebar]).sidebarLogo, sidebar.url)
  const hidden = { ...defaults, hiddenAssets: ['SIDEBAR_LOGO'] as const }
  const artwork = platformArtwork(
    'dreamcast',
    { ...hidden, hiddenAssets: [...hidden.hiddenAssets] },
    [logo, sidebar],
  )
  assert.equal(artwork.sidebarLogo, undefined)
  assert.equal(artwork.logo, logo.url)
  assert.equal(
    platformArtwork('dreamcast', defaults, [{ ...logo, active: false }]).logo,
    '/platforms/dreamcast/logo.webp',
  )
  assert.equal(platformArtwork('pc-engine', defaults, []).hardware, undefined)
})

test('Validation des modèles, placements et défauts indépendants par rôle de visuel', () => {
  for (const value of [
    { preset: 'unknown' },
    { card: { hardwareWidth: 200 } },
    { sidebar: { logoHeight: -1 } },
    { dateLabel: 'hier' },
  ])
    assert.equal(platformCustomizationSchema.safeParse(value).success, false)
  assert.equal(readPlatformCustomization({}).sidebar.hardwareWidth, 90)
  const parse = (visuals: PlatformVisual[]) =>
    platformVisualsSchema.safeParse({ platformId: 'pc-engine', visuals }).success
  assert.equal(parse([image('LOGO'), image('SIDEBAR_LOGO')]), true)
  assert.equal(parse([image('LOGO'), image('LOGO', 'other' as 'LOGO')]), false)
})
