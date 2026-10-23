import { createFileRoute } from '@tanstack/react-router'
import { GameForm } from '../components/game-form'
import { useLibrary } from '../components/ui'
export const Route = createFileRoute('/games/new')({
  validateSearch: (search): { platform?: string; fromWish?: string } => ({
    platform: typeof search.platform === 'string' ? search.platform : undefined,
    fromWish: typeof search.fromWish === 'string' ? search.fromWish : undefined,
  }),
  component: NewGamePage,
})

function NewGamePage() {
  const { platform, fromWish } = Route.useSearch()
  const { games } = useLibrary()
  const initialWish = fromWish
    ? games.find(
        (game) =>
          game.id === fromWish &&
          game.discover &&
          game.alternativePlatformIds.includes(platform ?? ''),
      )
    : undefined
  if (fromWish && !initialWish)
    return (
      <div className="empty-state">
        <h1>Cette envie n’est plus disponible sur cette plateforme.</h1>
        <p>Revenez à la fiche pour choisir une version.</p>
      </div>
    )
  return (
    <GameForm
      key={`${platform ?? ''}:${fromWish ?? ''}`}
      initialPlatformId={platform}
      initialWish={initialWish}
    />
  )
}
