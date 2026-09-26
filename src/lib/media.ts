import { z } from 'zod'

export const mediaCategories = {
  COVER: 'Jaquettes',
  SCREENSHOT: 'Images du jeu',
  BOX: 'Boîte',
  MEDIA: 'Support',
  DOCUMENT: 'Documents',
  OTHER: 'Divers',
} as const
export const linkTypes = {
  VIDEO: 'Vidéo',
  REVIEW: 'Test',
  ARTICLE: 'Article',
  GUIDE: 'Guide',
  OTHER: 'Autre lien',
} as const
export const webUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url('Indiquez une URL complète.')
  .refine((value) => {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  }, 'Utilisez une URL HTTP ou HTTPS sans identifiants.')
export const attachmentSchema = z.object({
  mediaId: z.string().min(1),
  category: z.enum(['COVER', 'SCREENSHOT', 'BOX', 'MEDIA', 'DOCUMENT', 'OTHER']),
  position: z.number().int().min(0).max(1000),
  caption: z.string().trim().max(500).default(''),
  isPrimary: z.boolean().default(false),
})
export const attachmentsSchema = z
  .array(attachmentSchema)
  .max(100)
  .superRefine((items, ctx) => {
    if (new Set(items.map((i) => i.mediaId)).size !== items.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Une image ne peut être ajoutée deux fois à la fiche.',
      })
    if (items.length && items.filter((i) => i.isPrimary).length !== 1)
      ctx.addIssue({ code: 'custom', message: 'Choisissez une seule image principale.' })
  })
export const gameLinkSchema = z.object({
  url: webUrlSchema,
  title: z.string().trim().max(200).default(''),
  type: z.enum(['VIDEO', 'REVIEW', 'ARTICLE', 'GUIDE', 'OTHER']),
  position: z.number().int().min(0).max(1000),
})
export type ImageInput = z.infer<typeof attachmentSchema>
export type LinkInput = z.infer<typeof gameLinkSchema>

export function orderImages(items: ImageInput[]): ImageInput[] {
  const primary = items.find((i) => i.isPrimary)?.mediaId ?? items[0]?.mediaId
  return items.map((item, position) => ({ ...item, position, isPrimary: item.mediaId === primary }))
}
