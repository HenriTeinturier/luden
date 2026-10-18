import { z } from 'zod'
import { platformAssetKinds, platformCustomizationSchema } from './platform-customization'

export const platformIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/)
export const platformVisualKind = z.enum(['BANNER', 'POSTER', ...platformAssetKinds])
export const platformSlideshowSchema = z.object({
  enabled: z.boolean(),
  seconds: z.number().int().min(3, '3 secondes minimum.').max(120, '120 secondes maximum.'),
})
export const deletePlatformVisualSchema = z.object({
  platformId: platformIdSchema,
  id: z.string().min(1).max(100),
})
export const platformVisualsSchema = z
  .object({
    platformId: platformIdSchema,
    slideshow: platformSlideshowSchema.optional(),
    customization: platformCustomizationSchema.optional(),
    visuals: z
      .array(
        z.object({
          id: z.string().min(1),
          kind: platformVisualKind,
          caption: z.string().trim().max(120),
          active: z.boolean(),
          isDefault: z.boolean(),
        }),
      )
      .max(100),
  })
  .superRefine(({ visuals }, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message, path: ['visuals'] })
    if (new Set(visuals.map((v) => v.id)).size !== visuals.length)
      fail('Une image apparaît plusieurs fois.')
    if (visuals.some((v) => v.isDefault && !v.active))
      fail('Une image par défaut doit être active.')
    for (const kind of platformVisualKind.options) {
      const active = visuals.filter((v) => v.kind === kind && v.active)
      if (active.length && active.filter((v) => v.isDefault).length !== 1)
        fail('Choisissez une image par défaut pour chaque type de visuel actif.')
    }
  })

export type PlatformVisual = {
  id: string
  kind: z.infer<typeof platformVisualKind>
  caption: string
  active: boolean
  isDefault: boolean
  position: number
  width: number
  height: number
  url: string
}

export function activePlatformVisuals(visuals: PlatformVisual[], kind: PlatformVisual['kind']) {
  return visuals
    .filter((v) => v.kind === kind && v.active)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.position - b.position)
}

export function withoutPlatformVisual(visuals: PlatformVisual[], id: string) {
  const remaining = visuals.filter((v) => v.id !== id).map((v) => ({ ...v }))
  for (const kind of platformVisualKind.options) {
    const active = remaining.filter((v) => v.kind === kind && v.active)
    if (active.length && !active.some((v) => v.isDefault)) active[0].isDefault = true
  }
  return remaining
}

export const platformPosterStorageKey = (platformId: string) =>
  `luden:platform-poster:v1:${platformId}`

export function restorePlatformPoster(
  storage: Pick<Storage, 'getItem'>,
  platformId: string,
  posters: PlatformVisual[],
) {
  try {
    const saved = storage.getItem(platformPosterStorageKey(platformId))
    if (posters.some((v) => v.id === saved)) return saved
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return posters[0]?.id ?? null
}
