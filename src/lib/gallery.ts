import { z } from 'zod'
import type { Game } from './types'

export const gallerySearch = z.object({
  q: z.string().optional(),
  platform: z.string().optional(),
  machine: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(['recent', 'title', 'rating', 'year', 'desire']).optional(),
  view: z.enum(['grid', 'list']).optional(),
  owned: z.enum(['all', 'current', 'past', 'none']).optional(),
  favorite: z.boolean().optional(),
})
export type GallerySearch = z.infer<typeof gallerySearch>
export function filterGames(games: Game[], filters: GallerySearch) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr')
  const filtered = games.filter(
    (g) =>
      (!filters.q ||
        normalize(
          `${g.title} ${g.developer} ${g.genres.join(' ')} ${g.experience?.memory ?? ''}`,
        ).includes(normalize(filters.q))) &&
      (!filters.platform || g.platformId === filters.platform) &&
      (!filters.machine || g.machineId === filters.machine) &&
      (!filters.status || (g.experience?.status ?? 'UNPLAYED') === filters.status) &&
      (!filters.favorite || g.favorite) &&
      (!filters.owned ||
        filters.owned === 'all' ||
        (filters.owned === 'none'
          ? g.possessions.length === 0
          : g.possessions.some(
              (p) => p.state === (filters.owned === 'past' ? 'PAST' : 'CURRENT'),
            ))),
  )
  return filtered.sort((a, b) => {
    if (filters.sort === 'title') return a.title.localeCompare(b.title, 'fr')
    if (filters.sort === 'rating')
      return (b.experience?.rating ?? -1) - (a.experience?.rating ?? -1)
    if (filters.sort === 'year') return (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
    if (filters.sort === 'desire') return (b.desire ?? -1) - (a.desire ?? -1)
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
