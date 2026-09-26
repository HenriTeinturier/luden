import { z } from 'zod'

export const defaultCategories = [
  'Plateforme',
  'Action / aventure',
  'RPG',
  'Combat',
  'Courses',
  'Sport',
  'Shoot ’em up',
  'Stratégie / gestion',
  'Réflexion / puzzle',
  'Simulation',
  'Autres',
]

export const categoriesSchema = z
  .array(
    z.object({
      id: z.string().min(1).optional(),
      name: z.string().trim().min(1, 'Donne un nom à chaque catégorie.').max(80),
    }),
  )
  .min(1)
  .max(50)
  .superRefine((items, ctx) => {
    const names = items.map((item) => item.name.toLocaleLowerCase('fr'))
    const ids = items.flatMap((item) => (item.id ? [item.id] : []))
    if (new Set(names).size !== names.length || new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Chaque catégorie doit être unique.' })
  })

// Preserve the gallery's chosen sort inside each group, and omit empty sections.
export function groupByCategory<T extends { categoryId?: string | null }>(
  games: T[],
  categories: { id: string; name: string }[],
) {
  const groups = categories.map((category) => ({
    id: category.id,
    name: category.name,
    games: games.filter((game) => game.categoryId === category.id),
  }))
  const knownIds = new Set(categories.map((category) => category.id))
  groups.push({
    id: 'uncategorized',
    name: 'À classer',
    games: games.filter((game) => !game.categoryId || !knownIds.has(game.categoryId)),
  })
  return groups.filter((group) => group.games.length)
}
