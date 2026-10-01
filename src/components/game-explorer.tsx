import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import type { Library } from '../lib/types'
import { GameSelectionContext } from './game-selection'
import { GameDetails, GameNavigation, useGameKeys } from './game-details'
import { GameForm } from './game-form'
import { UniverseSidebar } from './universe-sidebar'
import { verticalGameNeighbor } from '../lib/gallery-navigation'

export function GameExplorer({
  children,
  library,
}: {
  children: ReactNode
  library: Library | null
}) {
  const location = useLocation()
  const [selection, setSelection] = useState<{
    id: string
    ids: string[]
    location: string
  } | null>(null)
  const [mode, setMode] = useState<'sidebar' | 'full' | 'edit'>('sidebar')
  const [busy, setBusy] = useState(false)
  const [hidingUniverse, setHidingUniverse] = useState(false)
  const previousMode = useRef<'sidebar' | 'full'>('sidebar')
  const scroll = useRef(0)
  const mobileLibraryScroll = useRef(0)
  const panel = useRef<HTMLElement>(null)
  const [universeVisit, setUniverseVisit] = useState({ pathname: location.pathname, hidden: false })
  if (universeVisit.pathname !== location.pathname) {
    setUniverseVisit({ pathname: location.pathname, hidden: false })
    setSelection(null)
    setMode('sidebar')
    setBusy(false)
    setHidingUniverse(false)
  }
  const universe = library?.platforms.find(
    (p) => location.pathname.replace(/\/$/, '') === `/platforms/${p.id}`,
  )
  // Changing card density keeps the current game and its navigation sequence open.
  const locationKey =
    location.pathname +
    JSON.stringify(Object.entries(location.search).filter(([key]) => key !== 'columns'))
  const active = selection?.location === locationKey
  const game = active ? library?.games.find((g) => g.id === selection.id) : undefined
  const ids = selection?.ids.filter((id) => library?.games.some((g) => g.id === id)) ?? []
  const index = game ? ids.indexOf(game.id) : -1
  const showUniverse = Boolean(universe && !game && !universeVisit.hidden)
  useEffect(() => {
    if (!hidingUniverse || !showUniverse) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280
    const timer = setTimeout(() => {
      setUniverseVisit({ pathname: location.pathname, hidden: true })
      setHidingUniverse(false)
      requestAnimationFrame(() =>
        (document.getElementById('reopen-sidebar') ?? document.getElementById('main'))?.focus({
          preventScroll: true,
        }),
      )
    }, duration)
    return () => clearTimeout(timer)
  }, [hidingUniverse, showUniverse, location.pathname])

  function restoreLibrary(focusCollection = false) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: scroll.current, behavior: 'instant' })
      if (focusCollection) {
        // Returning focus to the cover after Escape would draw a selection-like outline.
        ;(document.getElementById('universe-sidebar') ?? document.getElementById('main'))?.focus({
          preventScroll: true,
        })
      } else panel.current?.focus({ preventScroll: true })
    })
  }
  function close() {
    if (busy || hidingUniverse) return
    if (!game && showUniverse) {
      setHidingUniverse(true)
    } else if (mode === 'full') {
      setMode('sidebar')
      restoreLibrary()
    } else {
      scroll.current = window.innerWidth > 800 ? window.scrollY : mobileLibraryScroll.current
      setSelection(null)
      if (universe) setUniverseVisit({ pathname: location.pathname, hidden: false })
      restoreLibrary(true)
    }
  }
  function move(delta: number) {
    const id = ids[index + delta]
    if (id && selection && !busy) {
      setSelection({ ...selection, id })
      if (mode === 'sidebar' && window.innerWidth > 800)
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>(`[data-game-id="${id}"]`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
        })
    }
  }
  function moveVertical(direction: number) {
    if (!game) return
    if (mode !== 'sidebar' || window.innerWidth <= 800) {
      move(direction)
      return
    }
    const sequence = new Set(ids)
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-game-id]'))
      .filter((card) => sequence.has(card.dataset.gameId!))
      .flatMap((card) => {
        const rect = card.getBoundingClientRect()
        // Layout offsets ignore the hover lift applied to a cover.
        let top = 0
        let element: HTMLElement | null = card
        while (element) {
          top += element.offsetTop
          element = element.offsetParent as HTMLElement | null
        }
        return rect.width && rect.height
          ? [{ id: card.dataset.gameId!, top, centerX: rect.left + rect.width / 2 }]
          : []
      })
    const nextId = verticalGameNeighbor(cards, game.id, direction)
    if (nextId) move(ids.indexOf(nextId) - index)
  }
  useGameKeys({
    enabled: (Boolean(game) || showUniverse) && mode !== 'edit' && !busy,
    close,
    move: game ? move : undefined,
    moveVertical: game ? moveVertical : undefined,
  })
  useEffect(() => {
    if (!game || mode === 'edit') return
    panel.current?.scrollTo({ top: 0 })
    panel.current?.focus({ preventScroll: true })
    if (mode === 'full' || window.innerWidth <= 800)
      window.scrollTo({ top: 0, behavior: 'instant' })
  }, [game?.id, mode])

  return (
    <GameSelectionContext.Provider
      value={{
        selectedId: game?.id ?? null,
        sidebarVisible: Boolean(game) || showUniverse,
        reopenSidebar:
          universe && !game && !showUniverse
            ? () => {
                setUniverseVisit({ pathname: location.pathname, hidden: false })
                requestAnimationFrame(() =>
                  document.getElementById('universe-sidebar')?.focus({ preventScroll: true }),
                )
              }
            : undefined,
        open: (id, sequence) => {
          if (busy) return
          setHidingUniverse(false)
          scroll.current = window.scrollY
          mobileLibraryScroll.current = window.scrollY
          setSelection({ id, ids: sequence.length ? sequence : [id], location: locationKey })
          setMode('sidebar')
        },
      }}
    >
      <div
        className={`game-workspace ${(game && mode === 'sidebar') || showUniverse ? 'with-game-sidebar' : ''} ${showUniverse ? 'with-universe-sidebar' : ''}`}
      >
        <div className="library-content" hidden={Boolean(game) && mode !== 'sidebar'}>
          {children}
        </div>
        {showUniverse && universe && (
          <UniverseSidebar
            key={universe.id}
            platform={universe}
            platforms={
              library?.platforms.filter((p) => library.games.some((g) => g.platformId === p.id)) ??
              []
            }
            visuals={library?.platformVisuals.filter((v) => v.platformId === universe.id) ?? []}
            onClose={close}
            hiding={hidingUniverse}
          />
        )}
        {game && mode === 'edit' ? (
          <GameForm
            key={game.id}
            game={game}
            onSaved={() => {
              setMode(previousMode.current)
              if (previousMode.current === 'sidebar') restoreLibrary()
            }}
            onCancel={() => {
              setMode(previousMode.current)
              if (previousMode.current === 'sidebar') restoreLibrary()
            }}
          />
        ) : (
          game && (
            <section
              ref={panel}
              tabIndex={-1}
              className={mode === 'sidebar' ? 'game-sidebar' : 'game-full-view'}
              aria-label={`Fiche de ${game.title}`}
            >
              <GameNavigation
                index={index}
                total={ids.length}
                disabled={busy}
                onMove={move}
                onClose={close}
                full={mode === 'full'}
                closeLabel={
                  mode === 'sidebar' && universe
                    ? `Revenir à l’accueil ${universe.name}`
                    : undefined
                }
              />
              <GameDetails
                key={game.id}
                game={game}
                compact={mode === 'sidebar'}
                onBusyChange={setBusy}
                onExpand={() => {
                  scroll.current = window.scrollY
                  setMode('full')
                }}
                onEdit={() => {
                  previousMode.current = mode === 'full' ? 'full' : 'sidebar'
                  if (mode === 'sidebar') scroll.current = window.scrollY
                  setMode('edit')
                  window.scrollTo({ top: 0 })
                }}
                onDeleted={() => {
                  setSelection(null)
                  setMode('sidebar')
                  restoreLibrary(true)
                }}
              />
            </section>
          )
        )}
      </div>
    </GameSelectionContext.Provider>
  )
}
