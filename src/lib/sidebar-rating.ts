import { hasPlayed } from './gallery'
import type { Game } from './types'

export function sidebarRatingKind(game: Game): 'rating' | 'desire' | 'souvenir' {
  if (hasPlayed(game)) return 'rating'
  return game.souvenir && !game.discover ? 'souvenir' : 'desire'
}
