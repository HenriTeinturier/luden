// Reusable game presentation models. Platform artwork is managed separately.
// Geometry sizes frames only; imported images always keep their own proportions.
type SceneGeometry = {
  marginBottom: number
  objectsBottom: number
  objectsScale: number
  boxHeight: number
  pairedBoxHeight: number
  pairedBoxWidth: number
  pairedBoxOffsetX: string
  supportWidth: number
  supportHeight: number
  supportMarginLeft: number
  supportOffsetX: string
  supportOffsetY: string
  fullBoxWidth: number
  fullSupportWidth: number
  fullSupportHeight: number
  fullSupportMarginLeft: number
}

type GalleryPresentation = {
  ratio: string
  wide: boolean
  appearance: 'legacy' | 'framed' | 'boxed'
  showEmptyStars: boolean
  imageRatio?: string
  naturalImageHeight?: boolean
}

type PresentationPreset = {
  label: string
  example: string
  support: 'generic' | 'floppy' | 'cartridge' | 'disc' | 'mini-disc' | 'umd' | 'card'
  supportRatio?: string
  gallery: GalleryPresentation
  scene: Partial<SceneGeometry>
}

const framed: GalleryPresentation = {
  ratio: '0.71',
  wide: false,
  appearance: 'framed',
  showEmptyStars: true,
}
const jewelScene: Partial<SceneGeometry> = {
  marginBottom: 180,
  objectsBottom: -160,
  pairedBoxWidth: 62,
  supportWidth: 42,
  supportHeight: 94,
  supportMarginLeft: -4,
  supportOffsetY: '16px',
  fullBoxWidth: 62,
  fullSupportWidth: 42,
  fullSupportHeight: 85,
  fullSupportMarginLeft: -4,
}
const dvdScene: Partial<SceneGeometry> = {
  boxHeight: 128,
  pairedBoxHeight: 128,
  pairedBoxWidth: 56,
  supportWidth: 44,
  supportHeight: 94,
  supportMarginLeft: 0,
  supportOffsetY: '16px',
  fullBoxWidth: 56,
  fullSupportWidth: 44,
  fullSupportHeight: 75,
  fullSupportMarginLeft: 0,
}

export const presentationPresets = {
  standard: {
    label: 'Présentation classique',
    example: 'Plateformes sans présentation dédiée',
    support: 'generic',
    gallery: { ...framed, appearance: 'legacy', showEmptyStars: false },
    scene: {},
  },
  'computer-box': {
    label: 'Grande boîte ordinateur',
    example: 'Amiga',
    support: 'floppy',
    gallery: { ...framed, showEmptyStars: false },
    scene: { boxHeight: 128.8, pairedBoxHeight: 128.8, supportOffsetY: '16px' },
  },
  'portrait-box': {
    label: 'Boîte verticale',
    example: 'Atari ST',
    support: 'floppy',
    gallery: { ...framed, showEmptyStars: false },
    scene: {},
  },
  'compact-box': {
    label: 'Boîte verticale 3:4',
    example: 'Amstrad CPC',
    support: 'floppy',
    gallery: { ...framed, ratio: '3 / 4', showEmptyStars: false },
    scene: {},
  },
  'landscape-box': {
    label: 'Boîte horizontale',
    example: 'Super Nintendo',
    support: 'cartridge',
    gallery: { ...framed, ratio: '1.42', wide: true, appearance: 'boxed' },
    scene: {},
  },
  'landscape-cartridge': {
    label: 'Boîte horizontale et grande cartouche',
    example: 'Nintendo 64',
    support: 'cartridge',
    gallery: { ...framed, ratio: '1.42', wide: true },
    scene: {
      marginBottom: 192,
      objectsBottom: -172,
      objectsScale: 0.8,
      pairedBoxHeight: 122,
      pairedBoxWidth: 74,
      pairedBoxOffsetX: '-11.5cqw',
      supportWidth: 42,
      supportHeight: 78,
      supportMarginLeft: -16,
      supportOffsetX: '11.5cqw',
      supportOffsetY: '16px',
      fullBoxWidth: 74,
      fullSupportWidth: 42,
      fullSupportHeight: 56,
      fullSupportMarginLeft: -16,
    },
  },
  'tall-cartridge': {
    label: 'Boîtier vertical et cartouche',
    example: 'Mega Drive',
    support: 'cartridge',
    gallery: { ...framed, ratio: '2 / 3' },
    scene: {
      boxHeight: 128,
      pairedBoxHeight: 128,
      pairedBoxWidth: 56,
      supportWidth: 48,
      supportHeight: 78,
      supportMarginLeft: -4,
      supportOffsetY: '16px',
      fullBoxWidth: 58,
      fullSupportWidth: 46,
      fullSupportHeight: 60,
      fullSupportMarginLeft: -4,
    },
  },
  'jewel-case': {
    label: 'Boîtier CD',
    example: 'PlayStation',
    support: 'disc',
    gallery: { ...framed, ratio: '1' },
    scene: jewelScene,
  },
  'wide-jewel-case': {
    label: 'Boîtier CD large',
    example: 'Dreamcast PAL',
    support: 'disc',
    gallery: { ...framed, ratio: '1', imageRatio: '1.24' },
    scene: {
      ...jewelScene,
      marginBottom: 204,
      objectsBottom: -184,
      supportHeight: 80,
      supportOffsetY: 'calc(16px - 20%)',
    },
  },
  'dvd-case': {
    label: 'Boîtier DVD',
    example: 'PlayStation 2, Xbox',
    support: 'disc',
    gallery: framed,
    scene: dvdScene,
  },
  'mini-disc': {
    label: 'Boîtier DVD et mini-disque',
    example: 'GameCube',
    support: 'mini-disc',
    gallery: framed,
    scene: {
      ...dvdScene,
      supportWidth: 32,
      supportHeight: 68,
      supportMarginLeft: 4,
      fullSupportWidth: 32,
      fullSupportHeight: 54,
      fullSupportMarginLeft: 4,
    },
  },
  'slim-case': {
    label: 'Boîtier étroit',
    example: 'Nintendo Switch',
    support: 'cartridge',
    gallery: { ...framed, ratio: '0.62' },
    scene: {},
  },
  'portable-cartridge-box': {
    label: 'Boîte verticale et petite cartouche — Game Boy',
    example: 'Game Boy',
    support: 'cartridge',
    supportRatio: '0.88',
    gallery: { ...framed, ratio: '0.8', naturalImageHeight: true },
    scene: {
      boxHeight: 128,
      pairedBoxHeight: 128,
      pairedBoxWidth: 64,
      supportWidth: 30,
      supportHeight: 64,
      supportMarginLeft: -4,
      supportOffsetY: '16px',
      fullBoxWidth: 64,
      fullSupportWidth: 30,
      fullSupportHeight: 50,
      fullSupportMarginLeft: -4,
    },
  },
  'square-card-case': {
    label: 'Boîtier carré et carte de jeu — Nintendo DS',
    example: 'Nintendo DS',
    support: 'card',
    supportRatio: '0.94',
    gallery: { ...framed, ratio: '1', naturalImageHeight: true },
    scene: {
      pairedBoxWidth: 72,
      supportWidth: 18,
      supportHeight: 40,
      supportMarginLeft: -2,
      supportOffsetY: '16px',
      fullBoxWidth: 72,
      fullSupportWidth: 18,
      fullSupportHeight: 32,
      fullSupportMarginLeft: -2,
    },
  },
  'portable-umd-case': {
    label: 'Boîtier étroit et UMD — PSP',
    example: 'PSP',
    support: 'umd',
    supportRatio: '1.1',
    gallery: { ...framed, ratio: '0.59' },
    scene: {
      ...dvdScene,
      pairedBoxWidth: 54,
      supportWidth: 32,
      supportHeight: 60,
      supportMarginLeft: 2,
      fullBoxWidth: 54,
      fullSupportWidth: 32,
      fullSupportHeight: 48,
      fullSupportMarginLeft: 2,
    },
  },
} satisfies Record<string, PresentationPreset>

export type PresentationPresetId = keyof typeof presentationPresets
export type ScenePresetId = PresentationPresetId | 'original'
type PresentationChoice = {
  preset: PresentationPresetId
  gallery?: Partial<GalleryPresentation>
  scene?: Partial<SceneGeometry>
}

// Compatibility assignments preserve the current look, including unfinished platforms.
// Future saved choices can use resolvePresentation directly, without a platform ID.
const platformChoices = {
  amiga: { preset: 'computer-box' },
  'atari-st': { preset: 'portrait-box' },
  amstrad: { preset: 'compact-box' },
  snes: { preset: 'landscape-box' },
  n64: { preset: 'landscape-cartridge' },
  megadrive: { preset: 'tall-cartridge' },
  ps1: { preset: 'jewel-case' },
  dreamcast: { preset: 'wide-jewel-case' },
  ps2: { preset: 'dvd-case' },
  ps3: { preset: 'standard', gallery: { ratio: '0.8', naturalImageHeight: true } },
  gamecube: { preset: 'mini-disc' },
  xbox: { preset: 'dvd-case', scene: { marginBottom: 210, objectsBottom: -190 } },
  switch: { preset: 'slim-case', gallery: { appearance: 'legacy', showEmptyStars: false } },
  'switch-2': { preset: 'slim-case', gallery: { appearance: 'legacy', showEmptyStars: false } },
  gba: { preset: 'standard', gallery: { ratio: '1.42', wide: true } },
  gameboy: { preset: 'portable-cartridge-box' },
  psp: { preset: 'portable-umd-case' },
  ds: { preset: 'square-card-case' },
  '3ds': { preset: 'standard', gallery: { ratio: '1' } },
} satisfies Record<string, PresentationChoice>

export function resolvePresentation(choice: PresentationChoice) {
  const preset: PresentationPreset = presentationPresets[choice.preset]
  const gallery = { ...preset.gallery, ...choice.gallery }
  const scene: SceneGeometry = {
    marginBottom: 168,
    objectsBottom: -148,
    objectsScale: 1,
    boxHeight: 112,
    pairedBoxHeight: 112,
    pairedBoxWidth: 65,
    pairedBoxOffsetX: '0px',
    supportWidth: 49,
    supportHeight: 90,
    supportMarginLeft: -12,
    supportOffsetX: '0px',
    supportOffsetY: '8px',
    fullBoxWidth: gallery.wide ? 78 : 65,
    fullSupportWidth: 39,
    fullSupportHeight: 65,
    fullSupportMarginLeft: -9,
    ...preset.scene,
    ...choice.scene,
  }
  return { preset: choice.preset, gallery, scene }
}

const defaultPresentation = resolvePresentation({ preset: 'standard' })
const resolvedPlatforms = new Map(
  Object.entries(platformChoices).map(([id, choice]) => [id, resolvePresentation(choice)]),
)

type PlatformChoice =
  | string
  | {
      id: string
      customization?: { preset?: PresentationPresetId | null; scenePreset?: ScenePresetId | null }
    }

export function platformPresentation(platform: PlatformChoice) {
  if (typeof platform !== 'string' && platform.customization?.preset) {
    return resolvePresentation({ preset: platform.customization.preset })
  }
  return (
    resolvedPlatforms.get(typeof platform === 'string' ? platform : platform.id) ??
    defaultPresentation
  )
}

export function coverFormat(platform: PlatformChoice) {
  const { ratio, wide } = platformPresentation(platform).gallery
  return { ratio, wide }
}

// An omitted choice follows the existing model, preserving every previously saved presentation.
export function platformScenePresentation(platform: PlatformChoice) {
  if (typeof platform === 'string') return platformPresentation(platform)
  const preset = platform.customization?.scenePreset
  if (preset === 'original') return platformPresentation(platform.id)
  return preset ? resolvePresentation({ preset }) : platformPresentation(platform)
}

export function sceneStyle(scene: SceneGeometry) {
  return {
    '--scene-margin-bottom': `${scene.marginBottom}px`,
    '--scene-objects-bottom': `${scene.objectsBottom}px`,
    '--scene-objects-scale': scene.objectsScale === 1 ? 'none' : scene.objectsScale,
    '--scene-box-height': `${scene.boxHeight}%`,
    '--scene-paired-box-height': `${scene.pairedBoxHeight}%`,
    '--scene-paired-box-width': `${scene.pairedBoxWidth}%`,
    '--scene-paired-box-x': scene.pairedBoxOffsetX,
    '--scene-support-width': `${scene.supportWidth}%`,
    '--scene-support-height': `${scene.supportHeight}%`,
    '--scene-support-margin-left': `${scene.supportMarginLeft}%`,
    '--scene-support-x': scene.supportOffsetX,
    '--scene-support-y': scene.supportOffsetY,
    '--scene-full-box-width': `${scene.fullBoxWidth}%`,
    '--scene-full-support-width': `${scene.fullSupportWidth}%`,
    '--scene-full-support-height': `${scene.fullSupportHeight}%`,
    '--scene-full-support-margin-left': `${scene.fullSupportMarginLeft}%`,
  }
}
