import type { CSSProperties } from 'react'
import type { PlatformCustomization, PlatformPlacement } from './platform-customization'
import { activePlatformVisuals, type PlatformVisual } from './platform-visuals'

const illustrated = new Set([
  'snes',
  'amiga',
  'amstrad',
  'atari-st',
  'megadrive',
  'ps1',
  'n64',
  'ps2',
  'gamecube',
  'xbox',
  'dreamcast',
])

export function platformArtwork(
  id: string,
  customization: PlatformCustomization,
  visuals: PlatformVisual[],
) {
  const base = illustrated.has(id) ? `/platforms/${id}` : undefined
  const defaults = {
    LOGO: base && `${base}/logo.webp`,
    BACKGROUND: base && `${base}/${id === 'atari-st' ? 'stripes' : 'graphite'}.webp`,
    HARDWARE:
      base &&
      `${base}/${['amiga', 'amstrad', 'atari-st'].includes(id) ? 'computer' : 'console'}.webp`,
  }
  type AssetKind = PlatformCustomization['hiddenAssets'][number]
  const resolve = (kind: AssetKind, fallback?: string) =>
    customization.hiddenAssets.includes(kind)
      ? undefined
      : (activePlatformVisuals(visuals, kind)[0]?.url ?? fallback)
  const logoSource = activePlatformVisuals(visuals, 'LOGO')[0]?.url ?? defaults.LOGO
  const hardwareSource = activePlatformVisuals(visuals, 'HARDWARE')[0]?.url ?? defaults.HARDWARE
  const logo = resolve('LOGO', defaults.LOGO)
  const background = resolve('BACKGROUND', defaults.BACKGROUND)
  const hardware = resolve('HARDWARE', defaults.HARDWARE)
  return {
    illustrated: !!base,
    customCard:
      (customization.cardEnabled && customization.cardLayout === 'free') ||
      (!base &&
        visuals.some((v) => v.active && ['LOGO', 'BACKGROUND', 'HARDWARE'].includes(v.kind))),
    logoSource,
    hardwareSource,
    logo,
    background,
    hardware,
    sidebarLogo: resolve('SIDEBAR_LOGO', logo),
    sidebarBackground: resolve('SIDEBAR_BACKGROUND', background),
    sidebarHardware: resolve('SIDEBAR_HARDWARE', hardware),
  }
}

export function artworkStyle(placement: PlatformPlacement, background?: string): CSSProperties {
  return {
    backgroundImage: background ? `url(${JSON.stringify(background)})` : 'none',
    backgroundPosition: `${placement.backgroundX}% ${placement.backgroundY}%`,
    '--art-logo-width': `${placement.logoWidth}%`,
    '--art-logo-height': `${placement.logoHeight}px`,
    '--art-logo-y': `${placement.logoY}px`,
    '--art-hardware-width': `${placement.hardwareWidth}%`,
    '--art-hardware-x': `${placement.hardwareX}%`,
    '--art-hardware-y': `${placement.hardwareY}%`,
  } as CSSProperties
}
