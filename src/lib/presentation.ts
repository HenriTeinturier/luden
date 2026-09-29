// Platform defaults, separate from catalogue metadata. Actual files are never cropped.
// Individual editions/custom visuals can override these presets later.
export function coverFormat(platformId: string) {
  if (platformId === 'amstrad') return { ratio: '3 / 4', wide: false }
  if (['snes', 'n64', 'gba'].includes(platformId)) return { ratio: '1.42', wide: true }
  if (['ps1', 'dreamcast', 'ds', '3ds'].includes(platformId)) return { ratio: '1', wide: false }
  if (platformId.startsWith('switch')) return { ratio: '0.62', wide: false }
  return { ratio: '0.71', wide: false }
}
