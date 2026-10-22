import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useLibrary } from '../components/ui'
import { GameForm } from '../components/game-form'
import { GameDetails, GameNavigation, useGameKeys } from '../components/game-details'
import {
  cleanLibrarySearch,
  cleanDiscoverySearch,
  filterGames,
  gameReturnSearch,
} from '../lib/gallery'
import { groupByCategory } from '../lib/categories'
import { wrapGameIndex } from '../lib/gallery-navigation'

export const Route = createFileRoute('/games/$gameId')({
  validateSearch: (input) => gameReturnSearch.parse(input),
  component: GamePage,
})

// Direct URLs and opening a card in a new tab use the same dossier as the inline explorer.
function GamePage() {
  const { gameId } = Route.useParams()
  const { games, categories } = useLibrary()
  const origin = Route.useSearch()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [compact, setCompact] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ids] = useState(() => {
    const source = games.filter((game) =>
      origin.from === 'platform'
        ? game.platformId === origin.fromId
        : origin.from === 'collection'
          ? game.entries.some((entry) => entry.collectionId === origin.fromId)
          : true,
    )
    const filters = {
      scope:
        origin.from === 'discover'
          ? ('discover' as const)
          : origin.from === 'platform'
            ? ('played' as const)
            : ('all' as const),
      ...origin.filters,
    }
    const filtered = filterGames(
      source,
      origin.from === 'discover'
        ? { ...cleanDiscoverySearch(filters), scope: 'discover', sort: filters.sort ?? 'desire' }
        : origin.from === 'library'
          ? cleanLibrarySearch(filters)
          : filters,
      origin.from === 'library' || origin.from === 'discover',
    )
    const ordered =
      origin.from !== 'library' &&
      origin.from !== 'discover' &&
      origin.filters?.group === 'category'
        ? groupByCategory(filtered, categories).flatMap((group) => group.games)
        : filtered
    const result = ordered.map((game) => game.id)
    return result.includes(gameId) ? result : [gameId, ...result]
  })
  const game = games.find((g) => g.id === gameId)
  const remaining = ids.filter((id) => games.some((g) => g.id === id))
  const index = remaining.indexOf(gameId)
  function returnToLibrary() {
    if (origin.from === 'platform' && origin.fromId)
      void navigate({
        to: '/platforms/$platformId',
        params: { platformId: origin.fromId },
        search: origin.filters ?? {},
      })
    else if (origin.from === 'collection' && origin.fromId)
      void navigate({
        to: '/collections/$collectionId',
        params: { collectionId: origin.fromId },
        search: origin.filters ?? {},
      })
    else
      void navigate({
        to: origin.from === 'discover' ? '/discover' : '/library',
        search: origin.filters ?? {},
      })
  }
  function close() {
    if (!compact) setCompact(true)
    else returnToLibrary()
  }
  function move(delta: number) {
    const id = remaining[wrapGameIndex(index, remaining.length, delta)]
    if (id && !busy)
      void navigate({ to: '/games/$gameId', params: { gameId: id }, search: origin, replace: true })
  }
  useGameKeys({
    enabled: Boolean(game) && !editing && !busy,
    close,
    move,
    expand: compact ? () => setCompact(false) : undefined,
  })
  if (!game)
    return (
      <div className="empty-state">
        <h1>Ce jeu n’est plus dans la bibliothèque.</h1>
        <Link to="/library">Revenir à mes jeux</Link>
      </div>
    )
  if (editing)
    return (
      <GameForm
        key={game.id}
        game={game}
        onSaved={() => setEditing(false)}
        onDeleted={returnToLibrary}
        onCancel={() => setEditing(false)}
      />
    )
  return (
    <section className={`game-full-view ${compact ? 'direct-game-preview' : ''}`}>
      <GameNavigation
        index={index}
        total={remaining.length}
        disabled={busy}
        onMove={move}
        onClose={close}
        full={!compact}
      />
      <GameDetails
        key={game.id}
        game={game}
        compact={compact}
        onBusyChange={setBusy}
        onExpand={() => setCompact(false)}
        onEdit={() => setEditing(true)}
        onDeleted={returnToLibrary}
      />
    </section>
  )
}
