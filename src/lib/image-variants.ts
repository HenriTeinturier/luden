export const imageWidths = [320, 640, 1280] as const
export type ImageWidth = (typeof imageWidths)[number]

export function parseImageWidth(value: string | null): ImageWidth | undefined {
  if (value === null) return undefined
  const width = imageWidths.find((size) => String(size) === value)
  if (!width) throw new Error('Taille de miniature invalide.')
  return width
}

// Width descriptors reflect the actual file width, including small originals.
// Leave decoding at the browser default: forcing async left loaded covers unpainted
// in Chrome until hover/scroll triggered a repaint.
export function mediaImageSources(url: string, originalWidth: number | undefined, sizes: string) {
  if (!/^\/media\/[a-zA-Z0-9_-]+$/.test(url)) return { src: url }
  const src = `${url}?w=640`
  if (!originalWidth || originalWidth < 1) return { src }
  const widths = new Set<number>()
  const candidates = imageWidths.flatMap((size) => {
    const width = Math.min(size, originalWidth)
    if (widths.has(width)) return []
    widths.add(width)
    return [`${url}?w=${size} ${width}w`]
  })
  return { src, srcSet: candidates.join(', '), sizes }
}
