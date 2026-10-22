export type HomePlatformsPreference = { mode: 'auto' | 'manual'; ids: string[] }
export const defaultHomePlatforms: HomePlatformsPreference = { mode: 'auto', ids: [] }
export const homePlatformsKey = 'luden:home-platforms:v1'

export function parseHomePlatforms(value: string | null): HomePlatformsPreference {
  try {
    const data = JSON.parse(value ?? 'null')
    if ((data?.mode !== 'auto' && data?.mode !== 'manual') || !Array.isArray(data.ids))
      return defaultHomePlatforms
    return {
      mode: data.mode,
      ids: data.ids.filter((id: unknown) => typeof id === 'string'),
    }
  } catch {
    return defaultHomePlatforms
  }
}

type HomePlatform = { id: string; name: string; customization: { hiddenFromPlatforms: boolean } }
export function selectHomePlatforms<T extends HomePlatform>(
  platforms: T[],
  games: { platformId: string }[],
  preference: HomePlatformsPreference,
): T[] {
  const visible = platforms.filter((p) => !p.customization.hiddenFromPlatforms)
  if (preference.mode === 'manual') {
    const byId = new Map(visible.map((p) => [p.id, p]))
    return [...new Set(preference.ids)].flatMap((id) => {
      const platform = byId.get(id)
      return platform ? [platform] : []
    })
  }
  const counts = new Map<string, number>()
  for (const game of games) counts.set(game.platformId, (counts.get(game.platformId) ?? 0) + 1)
  return visible
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }),
    )
    .slice(0, 6)
}

export function homePlatformCapacity(width: number): number {
  return width < 520 ? 1 : width < 760 ? 2 : 4
}

export function homePlatformWindow<T>(platforms: T[], capacity: number, page: number): T[] {
  return Array.from(
    { length: Math.min(capacity, platforms.length) },
    (_, index) => platforms[(page * capacity + index) % platforms.length],
  )
}
