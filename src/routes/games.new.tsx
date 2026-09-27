import { createFileRoute } from '@tanstack/react-router'
import { GameForm } from '../components/game-form'
export const Route = createFileRoute('/games/new')({
  validateSearch: (search): { platform?: string } => ({
    platform: typeof search.platform === 'string' ? search.platform : undefined,
  }),
  component: NewGamePage,
})

function NewGamePage() {
  const { platform } = Route.useSearch()
  return <GameForm initialPlatformId={platform} />
}
