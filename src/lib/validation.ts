import { z } from 'zod'
import { attachmentsSchema, gameLinkSchema } from './media'

const score = (max: number) => z.number().min(0).max(max).multipleOf(0.5).nullable()
export const possessionSchema = z
  .object({
    id: z.string().optional(),
    format: z.enum(['PHYSICAL', 'DIGITAL']),
    state: z.enum(['CURRENT', 'PAST']),
    store: z.string().trim().max(100).default(''),
  })
  .transform((p) => ({ ...p, store: p.format === 'PHYSICAL' ? '' : p.store }))

export const gameSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Le titre est obligatoire.').max(200),
  platformId: z.string().min(1, 'Choisis une plateforme.'),
  machineId: z.string().nullable().default(null),
  categoryId: z.string().min(1).nullable().optional(),
  releaseYear: z.number().int().min(1950).max(2100).nullable(),
  developer: z.string().trim().max(300).default(''),
  publisher: z.string().trim().max(300).default(''),
  genres: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  summary: z.string().max(12000).default(''),
  igdbId: z.number().int().positive().nullable().default(null),
  coverId: z.string().nullable().default(null),
  media: attachmentsSchema.optional(),
  links: z.array(gameLinkSchema).max(100).optional(),
  discover: z.boolean().default(false),
  desire: score(5).default(null),
  favorite: z.boolean().default(false),
  experience: z.object({
    status: z.enum(['UNPLAYED', 'PLAYED', 'PLAYING', 'FINISHED', 'ABANDONED']),
    rating: score(5),
    memory: z.string().max(20000),
    period: z.string().trim().max(200),
  }),
  possessions: z.array(possessionSchema).max(20),
  collectionIds: z.array(z.string()).max(100),
})

export type GameInput = z.infer<typeof gameSchema>
export const collectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).default(''),
  kind: z.enum(['REAL', 'DREAM']),
})

export function assertRealCollection(possessions: unknown[], selectedReal: boolean) {
  if (selectedReal && possessions.length === 0) {
    throw new Error(
      'Pour la collection réelle, indique une possession actuelle ou ancienne. Sinon, choisis une collection rêvée.',
    )
  }
}

export const emptyGame: GameInput = {
  title: '',
  platformId: '',
  machineId: null,
  categoryId: null,
  releaseYear: null,
  developer: '',
  publisher: '',
  genres: [],
  summary: '',
  igdbId: null,
  coverId: null,
  media: [],
  links: [],
  discover: false,
  desire: null,
  favorite: false,
  experience: { status: 'UNPLAYED', rating: null, memory: '', period: '' },
  possessions: [],
  collectionIds: [],
}
