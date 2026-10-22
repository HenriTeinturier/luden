import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { Library } from '../lib/types'
import { GameSelectionContext } from './game-selection'
import { GameDetails, GameNavigation, useGameKeys } from './game-details'
import { GameForm } from './game-form'
import { UniverseSidebar } from './universe-sidebar'
import { useGameViewHistory } from './use-game-view-history'
import {
  galleryCardPositions,
  verticalGameNeighbor,
  wrapGameIndex,
} from '../lib/gallery-navigation'

export function GameExplorer({
  children,
  library,
}: {
  children: ReactNode
  library: Library | null
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<{
    id: string
    ids: string[]
    location: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [hidingUniverse, setHidingUniverse] = useState(false)
  const [hidingGame, setHidingGame] = useState(false)
  const [homeColumns, setHomeColumns] = useState<number | undefined>()
  const collapseUniverseOnClose = useRef(false)
  const previousMode = useRef<'sidebar' | 'full'>('sidebar')
  const scroll = useRef(0)
  const mobileLibraryScroll = useRef(0)
  const panel = useRef<HTMLElement>(null)
  const [universeVisit, setUniverseVisit] = useState({ pathname: location.pathname, hidden: false })
  if (universeVisit.pathname !== location.pathname) {
    setUniverseVisit({ pathname: location.pathname, hidden: false })
    setSelection(null)
    setBusy(false)
    setHidingUniverse(false)
    setHidingGame(false)
    setHomeColumns(undefined)
  }
  const universe = library?.platforms.find(
    (p) => location.pathname.replace(/\/$/, '') === `/platforms/${p.id}`,
  )
  // Changing card density keeps the current game and its navigation sequence open.
  const locationKey =
    location.pathname +
    JSON.stringify(Object.entries(location.search).filter(([key]) => key !== 'columns'))
  const { mode, setMode, reset: resetView } = useGameViewHistory(locationKey, busy)
  const lastView = useRef({ mode, locationKey })
  useEffect(() => {
    const previous = lastView.current
    lastView.current = { mode, locationKey }
    if (previous.locationKey === locationKey && previous.mode !== 'sidebar' && mode === 'sidebar') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scroll.current, behavior: 'instant' })
        panel.current?.focus({ preventScroll: true })
      })
    }
  }, [mode, locationKey])
  const active = selection?.location === locationKey
  const game = active ? library?.games.find((g) => g.id === selection.id) : undefined
  const ids = selection?.ids.filter((id) => library?.games.some((g) => g.id === id)) ?? []
  const index = game ? ids.indexOf(game.id) : -1
  const showUniverse = Boolean(universe && !game && !universeVisit.hidden)
  const platforms =
    library?.platforms.filter((p) => library.games.some((g) => g.platformId === p.id)) ?? []
  useEffect(() => {
    if (!universe || platforms.length < 2 || mode === 'edit' || busy || hidingUniverse) return
    function changeUniverse(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !event.shiftKey ||
        !['ArrowLeft', 'ArrowRight'].includes(event.key)
      )
        return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')
      )
        return
      const index = platforms.findIndex((p) => p.id === universe!.id)
      if (index < 0) return
      const delta = event.key === 'ArrowLeft' ? -1 : 1
      const next = platforms[(index + delta + platforms.length) % platforms.length]
      // Keep Alt+Left/Right available for browser history and mouse navigation.
      event.preventDefault()
      void navigate({ to: '/platforms/$platformId', params: { platformId: next.id }, search: {} })
    }
    document.addEventListener('keydown', changeUniverse)
    return () => document.removeEventListener('keydown', changeUniverse)
  }, [universe, platforms, mode, busy, hidingUniverse, navigate])
  useEffect(() => {
    if (!hidingUniverse || !showUniverse) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360
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
    if (busy || hidingUniverse || hidingGame) return
    if (!game && showUniverse) {
      setHidingUniverse(true)
    } else if (mode === 'full') {
      setMode('sidebar')
      restoreLibrary()
    } else {
      scroll.current = window.innerWidth > 800 ? window.scrollY : mobileLibraryScroll.current
      setHidingGame(true)
    }
  }
  useEffect(() => {
    if (!hidingGame) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360
    const timer = setTimeout(() => {
      setSelection(null)
      setHidingGame(false)
      setHomeColumns(undefined)
      setUniverseVisit({ pathname: location.pathname, hidden: collapseUniverseOnClose.current })
      collapseUniverseOnClose.current = false
      restoreLibrary(true)
    }, duration)
    return () => clearTimeout(timer)
  }, [hidingGame, location.pathname])
  function move(delta: number) {
    const id = ids[wrapGameIndex(index, ids.length, delta)]
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
    const cards = galleryCardPositions(
      Array.from(document.querySelectorAll<HTMLElement>('[data-game-id]')).filter((card) =>
        sequence.has(card.dataset.gameId!),
      ),
    )
    const nextId = verticalGameNeighbor(cards, game.id, direction)
    if (nextId) move(ids.indexOf(nextId) - index)
  }
  function expand() {
    if (!game || mode !== 'sidebar' || busy) return
    scroll.current = window.scrollY
    setMode('full')
  }
  useGameKeys({
    enabled: (Boolean(game) || showUniverse) && mode !== 'edit' && !busy && !hidingGame,
    close,
    move: game ? move : undefined,
    moveVertical: game ? moveVertical : undefined,
    expand: game && mode === 'sidebar' ? expand : undefined,
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
          collapseUniverseOnClose.current = false
          if (!game && location.pathname === '/') {
            const grid = document.querySelector('.home-games')
            if (grid) setHomeColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').length)
          }
          setHidingGame(false)
          setHidingUniverse(false)
          scroll.current = window.scrollY
          mobileLibraryScroll.current = window.scrollY
          setSelection({ id, ids: sequence.length ? sequence : [id], location: locationKey })
          resetView()
        },
      }}
    >
      <div
        className={`game-workspace ${(game && mode === 'sidebar') || showUniverse ? 'with-game-sidebar' : ''} ${showUniverse ? 'with-universe-sidebar' : ''}`}
        style={{ '--home-columns': homeColumns } as CSSProperties}
      >
        <div className="library-content" hidden={Boolean(game) && mode !== 'sidebar'}>
          {children}
        </div>
        {((game && mode === 'sidebar') || showUniverse) && (
          <button
            type="button"
            className="sidebar-collapse-tab"
            aria-label="Replier la sidebar"
            title="Replier la sidebar"
            disabled={busy || hidingGame || hidingUniverse}
            onClick={() => {
              collapseUniverseOnClose.current = true
              close()
            }}
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        )}
        {showUniverse && universe && (
          <UniverseSidebar
            key={universe.id}
            platform={universe}
            platforms={platforms}
            visuals={library?.platformVisuals.filter((v) => v.platformId === universe.id) ?? []}
            onClose={close}
            hiding={hidingUniverse}
          />
        )}
        {game && mode === 'edit' ? (
          <GameForm
            key={game.id}
            game={game}
            onBusyChange={setBusy}
            onDeleted={() => {
              setSelection(null)
              setMode('sidebar')
              restoreLibrary(true)
            }}
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
              className={
                mode === 'sidebar'
                  ? `game-sidebar animated-game-sidebar${hidingGame ? ' is-closing' : ''}`
                  : 'game-full-view'
              }
              inert={hidingGame || undefined}
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
                onExpand={expand}
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
