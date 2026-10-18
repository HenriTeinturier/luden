import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  customizePlatform,
  platformCustomizationSchema,
  readPlatformCustomization,
} from '../src/lib/platform-customization'
import { platformArtwork } from '../src/lib/platform-artwork'
import { originalCardPlacement, originalCardStyles } from '../src/lib/platform-card-layout'
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
  const catalog = { id: 'xbox', name: 'Xbox', shortName: 'Xbox', family: 'Xbox', customization: {} }
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
    { scenePreset: 'unknown' },
    { card: { hardwareWidth: 200 } },
    { sidebar: { logoHeight: -1 } },
    { dateLabel: 'hier' },
  ])
    assert.equal(platformCustomizationSchema.safeParse(value).success, false)
  assert.equal(readPlatformCustomization({}).sidebar.hardwareWidth, 90)
  assert.equal(readPlatformCustomization({ preset: 'jewel-case' }).scenePreset, null)
  assert.equal(readPlatformCustomization({ scenePreset: 'original' }).scenePreset, 'original')
  const parse = (visuals: PlatformVisual[]) =>
    platformVisualsSchema.safeParse({ platformId: 'pc-engine', visuals }).success
  assert.equal(parse([image('LOGO'), image('SIDEBAR_LOGO')]), true)
  assert.equal(parse([image('LOGO'), image('LOGO', 'other' as 'LOGO')]), false)
})

test('Masquer ou remplacer un visuel ne bascule pas la carte d’origine vers une autre mise en page', () => {
  const defaults = readPlatformCustomization({})
  for (const id of [
    'atari-st',
    'amiga',
    'snes',
    'amstrad',
    'megadrive',
    'ps1',
    'n64',
    'ps2',
    'gamecube',
    'xbox',
    'dreamcast',
  ]) {
    const original = platformArtwork(id, defaults, [])
    for (const kind of ['LOGO', 'BACKGROUND', 'HARDWARE'] as const) {
      const hidden = platformArtwork(id, { ...defaults, hiddenAssets: [kind] }, [])
      assert.equal(hidden.customCard, false)
      assert.equal(hidden.logoSource, original.logoSource)
      assert.equal(hidden.hardwareSource, original.hardwareSource)
      assert.equal(
        hidden[kind === 'LOGO' ? 'logo' : kind === 'BACKGROUND' ? 'background' : 'hardware'],
        undefined,
      )
      assert.equal(platformArtwork(id, defaults, [image(kind)]).customCard, false)
    }
  }
  assert.equal(
    platformArtwork('pc-engine', { ...defaults, hiddenAssets: ['LOGO'] }, []).customCard,
    false,
  )
})

test('Activer le placement d’origine ne surcharge aucune dimension, puis chaque réglage reste indépendant', () => {
  for (const id of [
    'atari-st',
    'amiga',
    'snes',
    'amstrad',
    'megadrive',
    'ps1',
    'n64',
    'ps2',
    'gamecube',
    'xbox',
    'dreamcast',
  ]) {
    const value = readPlatformCustomization({
      cardEnabled: true,
      cardLayout: 'original',
      card: originalCardPlacement(id),
    })
    assert.equal(platformArtwork(id, value, []).customCard, false)
    assert.deepEqual(originalCardStyles(id, value.card), { logo: {}, hardware: {}, background: {} })
  }
  const atari = originalCardPlacement('atari-st')
  assert.equal(atari.logoWidth, 43)
  assert.deepEqual(originalCardStyles('atari-st', { ...atari, hardwareY: 5 }), {
    logo: {},
    hardware: { bottom: 'calc(6px + 5%)' },
    background: {},
  })
  assert.deepEqual(originalCardStyles('atari-st', { ...atari, logoWidth: 50 }), {
    logo: { width: '50%', maxWidth: 'none' },
    hardware: {},
    background: {},
  })
  // Older saved free compositions and their positions remain readable.
  const legacy = readPlatformCustomization({ cardEnabled: true, card: { hardwareWidth: 70 } })
  assert.equal(legacy.cardLayout, 'free')
  assert.equal(legacy.card.hardwareWidth, 70)
  assert.equal(platformArtwork('atari-st', legacy, []).customCard, true)
})
