export type PlatformMembership = {
  platformId: string
  discover?: boolean
  alternativePlatformIds?: string[]
}

export function alternativePlatforms(primary: string, ids: string[] = []) {
  return [...new Set(ids)].filter((id) => id !== primary)
}

// Stored alternatives become visible only while the game is in the wishlist.
export function gamePlatformIds(game: PlatformMembership) {
  return [
    game.platformId,
    ...(game.discover ? alternativePlatforms(game.platformId, game.alternativePlatformIds) : []),
  ]
}

export function belongsToPlatform(game: PlatformMembership, platformId: string) {
  return gamePlatformIds(game).includes(platformId)
}

export function isAlternativeWish(game: PlatformMembership, platformId?: string) {
  return Boolean(
    platformId && platformId !== game.platformId && belongsToPlatform(game, platformId),
  )
}

export function hasVersionHistory(game: {
  experience?: { status: string; rating: number | null; memory: string; period: string } | null
  possessions: unknown[]
  souvenir?: boolean
  favorite?: boolean
  entries?: unknown[]
}) {
  const experience = game.experience
  return Boolean(
    (experience &&
      (experience.status !== 'UNPLAYED' ||
        experience.rating !== null ||
        experience.memory ||
        experience.period)) ||
    game.possessions.length ||
    game.souvenir ||
    game.favorite ||
    game.entries?.length,
  )
}
