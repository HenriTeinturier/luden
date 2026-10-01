import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { gameSchema, collectionSchema, quickGameSchema } from '../lib/validation'
import { webUrlSchema } from '../lib/media'
import { categoriesSchema } from '../lib/categories'
import { platformVisualsSchema } from '../lib/platform-visuals'

export const savePlatformVisualsFn = createServerFn({ method: 'POST' })
  .validator(platformVisualsSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { savePlatformVisuals } = await import('./platform-visuals')
    return mutation(() => savePlatformVisuals(data))
  })

export const saveCategoriesFn = createServerFn({ method: 'POST' })
  .validator(categoriesSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { saveCategories } = await import('./categories')
    return mutation(() => saveCategories(data))
  })

export const libraryFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { assertLocalRequest } = await import('./request')
  assertLocalRequest()
  const { loadLibrary } = await import('./library')
  try {
    return { library: await loadLibrary(), error: null }
  } catch {
    return {
      library: null,
      error: 'La bibliothèque est indisponible. Vérifie Docker puis lance npm run db:setup.',
    }
  }
})

export const saveGameFn = createServerFn({ method: 'POST' })
  .validator(gameSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { saveGame } = await import('./library')
    return mutation(() => saveGame(data))
  })
export const quickUpdateGameFn = createServerFn({ method: 'POST' })
  .validator(quickGameSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { quickUpdateGame } = await import('./library')
    return mutation(() => quickUpdateGame(data))
  })
export const deleteGameFn = createServerFn({ method: 'POST' })
  .validator(z.string())
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { deleteGame } = await import('./library')
    return mutation(() => deleteGame(data))
  })
export const saveCollectionFn = createServerFn({ method: 'POST' })
  .validator(collectionSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { saveCollection } = await import('./library')
    return mutation(() => saveCollection(data))
  })
export const deleteCollectionFn = createServerFn({ method: 'POST' })
  .validator(z.string())
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { deleteCollection } = await import('./library')
    return mutation(() => deleteCollection(data))
  })
export const saveMachineFn = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { db, LOCAL_PROFILE_ID } = await import('./db')
    return mutation(() =>
      db.machine.create({
        data: { name: data.name, ownerId: LOCAL_PROFILE_ID },
        select: { id: true },
      }),
    )
  })
export const deleteMachineFn = createServerFn({ method: 'POST' })
  .validator(z.string())
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { db, LOCAL_PROFILE_ID } = await import('./db')
    return mutation(() => db.machine.deleteMany({ where: { id: data, ownerId: LOCAL_PROFILE_ID } }))
  })
export const saveProfileFn = createServerFn({ method: 'POST' })
  .validator(z.string().trim().min(1).max(80))
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { db, LOCAL_PROFILE_ID } = await import('./db')
    return mutation(() =>
      db.profile.update({
        where: { id: LOCAL_PROFILE_ID },
        data: { name: data },
        select: { name: true },
      }),
    )
  })
export const searchIgdbFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ query: z.string().trim().min(2).max(120), platformId: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { searchGames } = await import('./igdb')
    return mutation(() => searchGames(data.query, data.platformId))
  })
export const importIgdbCoverFn = createServerFn({ method: 'POST' })
  .validator(z.number().int().positive())
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { importCover } = await import('./igdb')
    return mutation(() => importCover(data))
  })

export const igdbImagesFn = createServerFn({ method: 'POST' })
  .validator(z.number().int().positive())
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { gameImages } = await import('./igdb')
    return mutation(() => gameImages(data))
  })
export const importIgdbImageFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      gameId: z.number().int().positive(),
      imageId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    }),
  )
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { importGameImage } = await import('./igdb')
    return mutation(() => importGameImage(data.gameId, data.imageId))
  })
export const importImageUrlFn = createServerFn({ method: 'POST' })
  .validator(webUrlSchema)
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { importImageUrl } = await import('./media')
    return mutation(() => importImageUrl(data))
  })
export const discardImageFn = createServerFn({ method: 'POST' })
  .validator(z.string().min(1))
  .handler(async ({ data }) => {
    const { mutation } = await import('./request')
    const { removeUnusedImages } = await import('./media')
    return mutation(() => removeUnusedImages([data]))
  })
