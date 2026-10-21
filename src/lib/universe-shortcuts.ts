type GameActivity = { id: string; platformId: string; updatedAt: string }
type Universe = { id: string; name: string }
export type UniverseActivity = {
  games: Record<string, string>
  changed: Record<string, number>
}

export function updateUniverseActivity(
  games: GameActivity[],
  previous: UniverseActivity | null,
  now: number,
): UniverseActivity {
  const changed = { ...previous?.changed }
  const current = Object.fromEntries(games.map((game) => [game.id, game.platformId]))
  for (const game of games) {
    changed[game.platformId] = Math.max(changed[game.platformId] ?? 0, Date.parse(game.updatedAt))
  }
  for (const [id, platformId] of Object.entries(previous?.games ?? {})) {
    if (current[id] !== platformId) changed[platformId] = now
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
    counts.set(game.platformId, (counts.get(game.platformId) ?? 0) + 1)
    activity[game.platformId] = Math.max(activity[game.platformId] ?? 0, Date.parse(game.updatedAt))
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
