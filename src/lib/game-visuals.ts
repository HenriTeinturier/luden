import { z } from 'zod'

export const cropSchema = z.object({
  x: z.number().min(0).max(100).default(50),
  y: z.number().min(0).max(100).default(50),
  zoom: z.number().min(1).max(3).default(1),
})
export const visualRoles = {
  box: 'Boîte / jaquette',
  support: 'Cartouche / disque / support',
  logo: 'Logo du titre',
  background: 'Fond du jeu',
} as const
export type VisualRole = keyof typeof visualRoles
export const presentationSchema = z.object({
  box: z.string().min(1).nullable().default(null),
  support: z.string().min(1).nullable().default(null),
  logo: z.string().min(1).nullable().default(null),
  background: z.string().min(1).nullable().default(null),
  sidebarCrop: cropSchema.default({ x: 50, y: 50, zoom: 1 }),
})
export type GamePresentation = z.infer<typeof presentationSchema>
export type BackgroundCrop = z.infer<typeof cropSchema>
export const defaultPresentation = () => presentationSchema.parse({})
export function readPresentation(value: unknown): GamePresentation {
  const parsed = presentationSchema.safeParse(value)
  return parsed.success ? parsed.data : defaultPresentation()
}

// Presentation references only images attached to this game; removing an image clears its roles.
export function retainVisuals(value: unknown, mediaIds: string[]): GamePresentation {
  const result = readPresentation(value)
  for (const role of Object.keys(visualRoles) as VisualRole[]) {
    if (result[role] && !mediaIds.includes(result[role])) result[role] = null
  }
  if (!result.background) result.sidebarCrop = { x: 50, y: 50, zoom: 1 }
  return result
}

export function cropGeometry(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  crop: BackgroundCrop,
) {
  const scale = Math.max(width / imageWidth, height / imageHeight) * crop.zoom
  const w = imageWidth * scale
  const h = imageHeight * scale
  return {
    width: w,
    height: h,
    left: ((width - w) * crop.x) / 100,
    top: ((height - h) * crop.y) / 100,
  }
}
