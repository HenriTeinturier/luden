import type { CSSProperties } from 'react'
import type { PlatformPlacement } from './platform-customization'

// Starting values mirror the native cards in platforms.css. Unchanged fields
// leave that CSS in charge, including its width caps and mobile adjustments.
export function originalCardPlacement(id: string): PlatformPlacement {
  const specific: Record<string, Partial<PlatformPlacement>> = {
    snes: { logoWidth: 48, logoY: 0, hardwareWidth: 53 },
    amiga: { logoWidth: 46, logoY: 0 },
    amstrad: { logoWidth: 44, logoY: 0, hardwareWidth: 57 },
    'atari-st': { logoWidth: 43, logoY: 30 },
    dreamcast: { logoHeight: 110 },
  }
  return {
    logoWidth: 47,
    logoHeight: 100,
    logoY: 16,
    hardwareWidth: 56,
    hardwareX: 0,
    hardwareY: 0,
    backgroundX: 50,
    backgroundY: 50,
    ...specific[id],
  }
}

export function originalCardStyles(id: string, value: PlatformPlacement) {
  const base = originalCardPlacement(id)
  const logo: CSSProperties = {}
  const hardware: CSSProperties = {}
  const background: CSSProperties = {}
  if (value.logoWidth !== base.logoWidth) {
    logo.width = `${value.logoWidth}%`
    logo.maxWidth = 'none'
  }
  if (value.logoHeight !== base.logoHeight) {
    logo.height = `${value.logoHeight}px`
    logo.objectFit = 'contain'
    logo.objectPosition = 'left top'
  }
  if (value.logoY !== base.logoY) logo.marginTop = `${value.logoY}px`
  if (value.hardwareWidth !== base.hardwareWidth) hardware.width = `${value.hardwareWidth}%`
  const [right, bottom] =
    id === 'snes'
      ? [8, 8]
      : id === 'amstrad'
        ? [6, 4]
        : ['amiga', 'atari-st'].includes(id)
          ? [8, 6]
          : [0, 0]
  if (value.hardwareX !== 0) hardware.right = `calc(${right}px + ${value.hardwareX}%)`
  if (value.hardwareY !== 0) hardware.bottom = `calc(${bottom}px + ${value.hardwareY}%)`
  if (value.backgroundX !== base.backgroundX || value.backgroundY !== base.backgroundY)
    background.backgroundPosition = `${value.backgroundX}% ${value.backgroundY}%`
  return { logo, hardware, background }
}
