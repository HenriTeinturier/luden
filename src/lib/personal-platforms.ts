import { z } from 'zod'
import { platformCategoriesSchema, platformCustomizationSchema } from './platform-customization'

export const createPlatformSchema = z
  .object({
    requestId: z.uuid(),
    name: z.string().trim().min(1, 'Le nom de la plateforme est obligatoire.').max(100),
    shortName: z.string().trim().max(30).default(''),
    family: z.string().trim().max(50).default(''),
    dateLabel: platformCustomizationSchema.shape.dateLabel,
    categories: platformCategoriesSchema,
    catalogPlatformId: z.string().min(1).max(80).nullable().default(null),
  })
  .refine((value) => value.catalogPlatformId !== 'pc' || value.categories.includes('COMPUTER'), {
    message: 'Un PC personnel doit appartenir à la catégorie Ordinateur.',
    path: ['categories'],
  })

export function metadataPlatformId(platform: { id: string; catalogPlatformId?: string | null }) {
  return platform.catalogPlatformId ?? platform.id
}
