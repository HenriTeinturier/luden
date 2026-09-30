import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import type { Library } from '../lib/types'
import { GameSelectionContext } from './game-selection'
import { GameDetails, GameNavigation, useGameKeys } from './game-details'
import { GameForm } from './game-form'

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
  const previousMode = useRef<'sidebar' | 'full'>('sidebar')
  const scroll = useRef(0)
  const mobileLibraryScroll = useRef(0)
  const trigger = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLElement>(null)
  const locationKey = location.pathname + location.searchStr
  const active = selection?.location === locationKey
  const game = active ? library?.games.find((g) => g.id === selection.id) : undefined
  const ids = selection?.ids.filter((id) => library?.games.some((g) => g.id === id)) ?? []
  const index = game ? ids.indexOf(game.id) : -1

  function restoreLibrary(focusCard = false) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: scroll.current, behavior: 'instant' })
      if (focusCard) {
        const card =
          document.querySelector<HTMLElement>(`[data-game-id="${game?.id}"]`) ?? trigger.current
        card?.focus({ preventScroll: true })
      } else panel.current?.focus({ preventScroll: true })
    })
  }
  function close() {
    if (busy) return
    if (mode === 'full') {
      setMode('sidebar')
      restoreLibrary()
    } else {
      scroll.current = window.innerWidth > 800 ? window.scrollY : mobileLibraryScroll.current
      setSelection(null)
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
  useGameKeys({ enabled: Boolean(game) && mode !== 'edit' && !busy, close, move })
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
        open: (id, sequence, element) => {
          if (busy) return
          trigger.current = element
          scroll.current = window.scrollY
          mobileLibraryScroll.current = window.scrollY
          setSelection({ id, ids: sequence.length ? sequence : [id], location: locationKey })
          setMode('sidebar')
        },
      }}
    >
      <div className={`game-workspace ${game && mode === 'sidebar' ? 'with-game-sidebar' : ''}`}>
        <div className="library-content" hidden={Boolean(game) && mode !== 'sidebar'}>
          {children}
        </div>
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
