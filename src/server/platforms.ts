import { unlink } from 'node:fs/promises'
import type { Prisma } from '@prisma/client'
import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import { resolveMediaPath } from './media-path'
import { createPlatformSchema } from '../lib/personal-platforms'
import { platformIdSchema } from '../lib/platform-visuals'
import { readPlatformCustomization } from '../lib/platform-customization'
import { platformPresentation } from '../lib/presentation'

export const accessiblePlatforms = { OR: [{ ownerId: null }, { ownerId }] }

export async function setPlatformVisibility({
  platformId,
  visible,
}: {
  platformId: string
  visible: boolean
}) {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Platform" WHERE "id" = ${platformId} FOR UPDATE`
    const platform = await tx.platform.findFirstOrThrow({
      where: { id: platformId, isDraft: false, ...accessiblePlatforms },
    })
    await tx.platform.update({
      where: { id: platformId },
      data: {
        customization: {
          ...readPlatformCustomization(platform.customization),
          hiddenFromPlatforms: !visible,
        },
      },
    })
  })
}

export async function assertCatalogPlatform(
  tx: Prisma.TransactionClient,
  id: string | null,
  categories: string[],
) {
  if (!id) return
  await tx.platform.findFirstOrThrow({ where: { id, ownerId: null, isDraft: false } })
  if (id === 'pc' && !categories.includes('COMPUTER'))
    throw new Error('Un PC personnel doit appartenir à la catégorie Ordinateur.')
}

export async function createPlatform(input: unknown) {
  const data = createPlatformSchema.parse(input)
  const id = `custom-${data.requestId}`
  return db.$transaction(async (tx) => {
    await assertCatalogPlatform(tx, data.catalogPlatformId, data.categories)
    // Retrying the first screen must not create a duplicate or overwrite a resumed draft.
    const platform = await tx.platform.upsert({
      where: { id },
      update: { id },
      create: {
        id,
        ownerId,
        isDraft: true,
        name: data.name,
        shortName: data.shortName || data.name.slice(0, 30),
        family: data.family || 'Personnel',
        era: data.dateLabel || '',
        color: '#8070bd',
        catalogPlatformId: data.catalogPlatformId,
        customization: readPlatformCustomization({
          dateLabel: data.dateLabel,
          categories: data.categories,
          cardEnabled: true,
          sidebarMode: 'composition',
          preset:
            data.catalogPlatformId === 'pc'
              ? 'computer-box'
              : platformPresentation(data.catalogPlatformId ?? '').preset,
        }),
      },
    })
    if (platform.ownerId !== ownerId) throw new Error('Cette plateforme est inaccessible.')
    return { platformId: id }
  })
}

export async function deletePersonalPlatform(input: unknown) {
  const id = platformIdSchema.parse(input)
  const files = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Platform" WHERE "id" = ${id} FOR UPDATE`
    await tx.platform.findFirstOrThrow({ where: { id, ownerId } })
    if (await tx.game.count({ where: { platformId: id } }))
      throw new Error('Déplacez ou supprimez les jeux de cette plateforme avant de la supprimer.')
    if (await tx.gameWishPlatform.count({ where: { platformId: id } }))
      throw new Error(
        'Retirez cette plateforme des alternatives de vos envies avant de la supprimer.',
      )
    const visuals = await tx.platformVisual.findMany({ where: { platformId: id } })
    const paths = visuals.map((visual) =>
      resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', visual.path),
    )
    await tx.platform.delete({ where: { id } })
    return paths
  })
  let warning: string | null = null
  for (const file of files) {
    try {
      await unlink(file)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        warning =
          'Plateforme supprimée, mais certains fichiers n’ont pas pu être retirés du disque.'
    }
  }
  return { platformId: id, warning }
}
