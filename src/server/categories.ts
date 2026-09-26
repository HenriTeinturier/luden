import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import { categoriesSchema } from '../lib/categories'

export async function saveCategories(input: unknown) {
  const items = categoriesSchema.parse(input)
  return db.$transaction(async (tx) => {
    const existing = await tx.gameCategory.findMany({ where: { ownerId }, select: { id: true } })
    const ids = items.flatMap((item) => (item.id ? [item.id] : []))
    if (existing.length !== ids.length || existing.some((item) => !ids.includes(item.id)))
      throw new Error('La liste des catégories a changé. Actualise la page avant de réessayer.')
    for (const [position, item] of items.entries()) {
      if (item.id)
        await tx.gameCategory.update({
          where: { id: item.id },
          data: { name: item.name, position },
        })
      else await tx.gameCategory.create({ data: { ownerId, name: item.name, position } })
    }
    return tx.gameCategory.findMany({ where: { ownerId }, orderBy: { position: 'asc' } })
  })
}
