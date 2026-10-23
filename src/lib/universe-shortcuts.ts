import { gamePlatformIds, type PlatformMembership } from './wish-platforms'

type GameActivity = PlatformMembership & { id: string; updatedAt: string }
type Universe = { id: string; name: string }
export type UniverseActivity = {
  games: Record<string, string | string[]>
  changed: Record<string, number>
}

export function updateUniverseActivity(
  games: GameActivity[],
  previous: UniverseActivity | null,
  now: number,
): UniverseActivity {
  const changed = { ...previous?.changed }
  const current = Object.fromEntries(games.map((game) => [game.id, gamePlatformIds(game)]))
  for (const game of games) {
    for (const id of gamePlatformIds(game))
      changed[id] = Math.max(changed[id] ?? 0, Date.parse(game.updatedAt))
  }
  for (const [id, platformIds] of Object.entries(previous?.games ?? {})) {
    for (const platformId of typeof platformIds === 'string' ? [platformIds] : platformIds)
      if (!current[id]?.includes(platformId)) changed[platformId] = now
  }
  return { games: current, changed }
}

export function universeShortcuts<T extends Universe>(
  platforms: T[],
  games: GameActivity[],
  changed: Record<string, number>,
): T[] {
  const counts = new Map<string, number>()
  const activity = { ...changed }
  for (const game of games) {
    for (const id of gamePlatformIds(game)) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
      activity[id] = Math.max(activity[id] ?? 0, Date.parse(game.updatedAt))
    }
  }
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'fr')
  const largest = platforms
    .filter((p) => counts.has(p.id))
    .sort((a, b) => counts.get(b.id)! - counts.get(a.id)! || byName(a, b))
    .slice(0, 5)
  const recent = platforms
    .filter((p) => activity[p.id])
    .sort((a, b) => activity[b.id] - activity[a.id] || byName(a, b))
    .slice(0, 2)
  return [...largest, ...recent.filter((p) => !largest.some((top) => top.id === p.id))]
}
