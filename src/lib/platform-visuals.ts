import { z } from 'zod'

export const platformIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/)
export const platformVisualKind = z.enum(['BANNER', 'POSTER'])
export const deletePlatformVisualSchema = z.object({
  platformId: platformIdSchema,
  id: z.string().min(1).max(100),
})
export const platformVisualsSchema = z
  .object({
    platformId: platformIdSchema,
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
