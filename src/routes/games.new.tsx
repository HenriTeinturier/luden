import { createFileRoute } from '@tanstack/react-router'
import { GameForm } from '../components/game-form'
export const Route = createFileRoute('/games/new')({ component: () => <GameForm /> })
