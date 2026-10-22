import { z } from 'zod'
import type { Game } from './types'

export const gallerySearch = z.object({
  q: z.string().optional(),
  platform: z.string().optional(),
  machine: z.string().optional(),
  status: z.string().optional(),
  scope: z.enum(['all', 'played', 'discover', 'owned', 'unassigned']).optional(),
  sort: z.enum(['recent', 'title', 'platform', 'rating', 'year', 'desire', 'random']).optional(),
  randomSeed: z.number().int().min(0).max(0xffffffff).optional().catch(undefined),
  view: z.enum(['grid', 'list']).optional(),
  theme: z.enum(['1', '2']).optional().catch(undefined),
  columns: z
    .union([z.literal('auto'), z.number().int().min(4).max(10)])
    .optional()
    .catch(undefined),
  group: z.enum(['none', 'category']).optional(),
  owned: z.enum(['all', 'current', 'past', 'none']).optional(),
  favorite: z.boolean().optional(),
  souvenir: z.boolean().optional(),
})
export type GallerySearch = z.infer<typeof gallerySearch>

// Library controls have a deliberately smaller contract than universe/collection galleries.
// Whitelisting also retires old URL and localStorage filters instead of leaving them active.
export function cleanLibrarySearch(search: GallerySearch): GallerySearch {
  const owned =
    search.scope === 'owned'
      ? 'current'
      : search.owned === 'current'
        ? 'current'
        : search.owned === 'all'
          ? 'all'
          : undefined
  return {
    q: search.q,
    platform: search.platform,
    scope: search.favorite || owned === 'current' ? 'all' : search.scope,
    owned: search.favorite ? 'all' : owned,
    favorite: search.favorite,
    sort: search.sort,
    randomSeed: search.randomSeed,
    theme: search.theme,
    columns: search.columns,
  }
}
export const librarySearch = gallerySearch.transform(cleanLibrarySearch)

export function librarySelection(filters: GallerySearch) {
  if (filters.favorite) return 'favorites'
  if (filters.owned === 'current' || filters.scope === 'owned') return 'owned'
  if (filters.scope === 'played') return 'played'
  if (filters.scope === 'discover') return 'desire'
  if (filters.scope === 'unassigned') return 'sorting'
  return 'library'
}

// Old links used possession as a view. Preserve their selection as All + Owned.
export function galleryFilters(
  search: GallerySearch,
  defaultScope: GallerySearch['scope'] = 'all',
  discovery = false,
): GallerySearch {
  return {
    ...search,
    scope: discovery
      ? 'discover'
      : search.scope === 'owned'
        ? 'all'
        : (search.scope ?? defaultScope),
    owned: search.scope === 'owned' ? 'current' : search.owned,
    favorite: discovery ? false : search.favorite,
  }
}

export function toggleGalleryScope(
  filters: GallerySearch,
  scope: 'played' | 'discover' | 'all' | 'unassigned',
): GallerySearch {
  return { ...filters, scope: filters.scope === scope ? 'all' : scope, status: '' }
}
export const gameReturnSearch = z.object({
  from: z.enum(['library', 'platform', 'collection', 'discover']).optional().catch(undefined),
  fromId: z.string().optional().catch(undefined),
  filters: gallerySearch.optional().catch(undefined),
})
export function hasPlayed(game: Game) {
  return Boolean(game.experience && game.experience.status !== 'UNPLAYED')
}

export function needsSorting(game: Game) {
  return !hasPlayed(game) && !game.discover && !game.souvenir
}

// Stable per-game ranks preserve relative order through filtering, edits and return navigation.
function randomRank(id: string, seed: number) {
  let hash = 2166136261 ^ seed
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619)
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
  return (hash ^ (hash >>> 16)) >>> 0
}

export function filterGames(games: Game[], filters: GallerySearch, titleOnly = false) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr')
  const filtered = games.filter(
    (g) =>
      (!filters.q ||
        normalize(
          titleOnly
            ? g.title
            : `${g.title} ${g.developer} ${g.genres.join(' ')} ${g.experience?.memory ?? ''}`,
        ).includes(normalize(filters.q.trim()))) &&
      (!filters.platform || g.platformId === filters.platform) &&
      (!filters.machine || g.machineId === filters.machine) &&
      (!filters.status || (g.experience?.status ?? 'UNPLAYED') === filters.status) &&
      (filters.scope !== 'played' || hasPlayed(g)) &&
      (filters.scope !== 'discover' || g.discover) &&
      (filters.scope !== 'unassigned' || needsSorting(g)) &&
      (filters.scope !== 'owned' || g.possessions.some((p) => p.state === 'CURRENT')) &&
      (!filters.favorite || g.favorite) &&
      (!filters.souvenir || g.souvenir) &&
      (!filters.owned ||
        filters.owned === 'all' ||
        (filters.owned === 'none'
          ? g.possessions.length === 0
          : g.possessions.some(
              (p) => p.state === (filters.owned === 'past' ? 'PAST' : 'CURRENT'),
            ))),
  )
  if (filters.sort === 'random') {
    // Compute each rank once, not at every sort comparison. Never mutate the library array.
    return filtered
      .map((game) => ({ game, rank: randomRank(game.id, filters.randomSeed ?? 0) }))
      .sort(
        (a, b) => a.rank - b.rank || (a.game.id < b.game.id ? -1 : a.game.id > b.game.id ? 1 : 0),
      )
      .map(({ game }) => game)
  }
  return filtered.sort((a, b) => {
    if (filters.sort === 'platform')
      return (
        a.platform.name.localeCompare(b.platform.name, 'fr') || a.title.localeCompare(b.title, 'fr')
      )
    if (filters.sort === 'title') return a.title.localeCompare(b.title, 'fr')
    if (filters.sort === 'rating')
      return (b.experience?.rating ?? -1) - (a.experience?.rating ?? -1)
    if (filters.sort === 'year') return (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
    if (filters.sort === 'desire') return (b.desire ?? -1) - (a.desire ?? -1)
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
