import { coverFormat } from '../lib/presentation'
import { useMatch, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { LibraryToolbar } from './library-toolbar'
import { GalleryToolbar } from './gallery-toolbar'
import { GalleryStats } from './gallery-stats'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useGameSelection } from './game-selection'
import {
  filterGames,
  galleryFilters,
  cleanLibrarySearch,
  cleanUniverseSearch,
  cleanDiscoverySearch,
  type GallerySearch,
} from '../lib/gallery'
import {
  galleryCardPositions,
  galleryKeyboardNeighbor,
  stepGalleryColumns,
} from '../lib/gallery-navigation'
import type { Game } from '../lib/types'
import { EmptyState, GameCard, useLibrary } from './ui'
import { groupByCategory } from '../lib/categories'
import {
  galleryPreferenceKey,
  restoreGalleryPreferences,
  saveGalleryPreferences,
} from '../lib/gallery-preferences'

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia('(min-width: 801px)')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const isDesktop = () => window.matchMedia('(min-width: 801px)').matches
const serverDesktop = () => false

export function Gallery({
  games,
  platformLocked = false,
  defaultScope = 'all',
  discovery = false,
  showStats = false,
}: {
  games: Game[]
  discovery?: boolean
  showStats?: boolean
  platformLocked?: boolean
  defaultScope?: GallerySearch['scope']
}) {
  const library = useLibrary()
  const search = useSearch({ strict: false }) as GallerySearch
  const [query, setQuery] = useState(search.q ?? '')
  const editingQuery = useRef(false)
  const compactControls = showStats || discovery
  const cleanSearch = platformLocked
    ? cleanUniverseSearch
    : discovery
      ? cleanDiscoverySearch
      : cleanLibrarySearch
  const normalized = compactControls ? cleanSearch(search) : search
  const filters = galleryFilters(
    {
      ...normalized,
      q: compactControls ? query : normalized.q,
      sort: normalized.sort ?? (discovery ? 'desire' : undefined),
    },
    defaultScope,
    discovery,
  )
  const visible = filterGames(games, filters, compactControls)
  const navigate = useNavigate()
  const router = useRouter()
  const pathname = useMatch({ strict: false, select: (match) => match.pathname })
  useEffect(() => {
    if (!editingQuery.current) setQuery(search.q ?? '')
  }, [search.q, pathname])
  useEffect(() => {
    if (!compactControls || !editingQuery.current) return
    if (query === (search.q ?? '')) {
      editingQuery.current = false
      return
    }
    // Cards react synchronously; only URL updates are debounced.
    const timer = window.setTimeout(() => {
      void navigate({
        to: '.',
        search: cleanSearch({ ...search, q: query }),
        replace: true,
        resetScroll: false,
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [query, search, compactControls, cleanSearch, navigate])
  function changeQuery(value: string) {
    editingQuery.current = true
    setQuery(value)
  }
  const selection = useGameSelection()
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop)
  const columnBonus = desktop && selection?.sidebarVisible === false ? 2 : 0
  const gallery = useRef<HTMLDivElement>(null)
  const browseGames = selection?.selectedId === null
  const lastGame = useRef<{ pathname: string; id: string } | null>(null)
  const focusedPlatform = useRef<string | null>(null)
  useEffect(() => {
    if (!platformLocked || !browseGames || focusedPlatform.current === pathname) return
    const frame = requestAnimationFrame(() => {
      const first = gallery.current?.querySelector<HTMLElement>('[data-game-id]')
      if (!first?.dataset.gameId) return
      focusedPlatform.current = pathname
      lastGame.current = { pathname, id: first.dataset.gameId }
      first.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [platformLocked, browseGames, pathname, visible.length])
  useEffect(() => {
    if (selection?.selectedId) lastGame.current = { pathname, id: selection.selectedId }
  }, [selection?.selectedId, pathname])
  useEffect(() => {
    const container = gallery.current
    if (!container || !browseGames) return
    function moveGalleryFocus(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      )
        return
      if (
        !container!.getBoundingClientRect().width ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      )
        return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="slider"], summary',
        )
      )
        return
      if (target?.closest('button, [role="button"]') && target.id !== 'reopen-sidebar') return
      if (target?.closest('a') && !target.closest('[data-game-id]')) return
      const elements = Array.from(container!.querySelectorAll<HTMLElement>('[data-game-id]'))
      const cards = galleryCardPositions(elements)
      const focusedId = target?.closest<HTMLElement>('[data-game-id]')?.dataset.gameId
      const currentId =
        focusedId ?? (lastGame.current?.pathname === pathname ? lastGame.current.id : undefined)
      const nextId = galleryKeyboardNeighbor(cards, currentId, event.key)
      if (!cards.length) return
      event.preventDefault()
      // At an edge, retain the last game as a keyboard target without reopening it.
      const id = nextId ?? (cards.some((card) => card.id === currentId) ? currentId : undefined)
      const next = elements.find((card) => card.dataset.gameId === id)
      if (!next || !id) return
      lastGame.current = { pathname, id }
      next.focus({ preventScroll: true })
      next.scrollIntoView({ block: 'nearest', behavior: 'instant' })
      // Enter retains the card link's native activation, which opens the sidebar.
    }
    document.addEventListener('keydown', moveGalleryFocus)
    return () => document.removeEventListener('keydown', moveGalleryFocus)
  }, [browseGames, pathname, visible.length])
  const lastWheel = useRef(-Infinity)
  const [autoColumns, setAutoColumns] = useState<{ pathname: string; count: number } | null>(null)
  const measuredAuto = autoColumns?.pathname === pathname ? autoColumns.count : undefined
  const displayedColumns =
    typeof filters.columns === 'number' ? filters.columns + columnBonus : 'auto'
  const gridColumns =
    displayedColumns === 'auto'
      ? columnBonus && measuredAuto
        ? measuredAuto + columnBonus
        : undefined
      : displayedColumns
  useEffect(() => {
    if (
      !desktop ||
      !selection?.sidebarVisible ||
      typeof filters.columns === 'number' ||
      filters.view === 'list'
    )
      return
    const container = gallery.current
    if (!container) return
    const measure = () => {
      const grid = container.querySelector('.game-grid')
      if (!grid || !grid.getBoundingClientRect().width) return
      const tracks = getComputedStyle(grid).gridTemplateColumns
      if (!tracks || tracks === 'none') return
      const count = tracks.split(' ').length
      setAutoColumns((previous) =>
        previous?.pathname === pathname && previous.count === count
          ? previous
          : { pathname, count },
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    measure()
    return () => observer.disconnect()
  }, [desktop, selection?.sidebarVisible, filters.columns, filters.view, pathname, visible.length])
  const restoredEntry = useRef<{ pathname: string; bare: boolean } | null>(null)
  useEffect(() => {
    // The outgoing gallery can still render while the next route is loading.
    // Never restore its filters onto the destination (notably /games/new).
    if (router.state.location.pathname !== pathname) return
    const bare = Object.values(search).every((value) => value === undefined)
    const previous = restoredEntry.current
    restoredEntry.current = { pathname, bare }
    // A shortcut back to the current universe can clear its URL without remounting it.
    if (previous?.pathname === pathname && (!bare || previous.bare)) return
    try {
      const restored = restoreGalleryPreferences(
        localStorage.getItem(galleryPreferenceKey(pathname)),
        search,
        platformLocked ? 'universe' : discovery ? 'discovery' : showStats,
      )
      saveGalleryPreferences(pathname, { ...restored, scope: restored.scope ?? defaultScope })
      if (
        Object.entries(restored).some(
          ([key, value]) => search[key as keyof GallerySearch] !== value,
        )
      ) {
        void navigate({ to: '.', search: restored, replace: true, resetScroll: false })
      }
    } catch {
      // Browser storage is optional, including during private browsing.
    }
  }, [pathname, search, navigate, defaultScope, router, showStats, discovery, platformLocked])
  const update = (patch: Partial<GallerySearch>) => {
    if (patch.q !== undefined) {
      editingQuery.current = false
      setQuery(patch.q)
    }
    const next = compactControls ? cleanSearch({ ...filters, ...patch }) : { ...filters, ...patch }
    saveGalleryPreferences(pathname, next)
    void navigate({ to: '.', search: next, replace: true, resetScroll: false })
  }
  const reshuffle = () => {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]
    update({
      sort: 'random',
      randomSeed: seed === (filters.randomSeed ?? 0) ? (seed + 1) >>> 0 : seed,
    })
  }
  useEffect(() => {
    const container = gallery.current
    if (!container || filters.view === 'list') return
    function wheel(event: WheelEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || !event.deltaY) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (document.activeElement?.closest('input, textarea, select, [contenteditable="true"]'))
        return
      const grid = container!.querySelector('.game-grid')
      if (!grid || !grid.getBoundingClientRect().width) return
      // A native non-passive listener replaces browser zoom only over the gallery.
      event.preventDefault()
      const now = performance.now()
      if (now - lastWheel.current < 160) return
      lastWheel.current = now
      const current =
        typeof displayedColumns === 'number'
          ? displayedColumns
          : getComputedStyle(grid).gridTemplateColumns.split(' ').length
      const columns = stepGalleryColumns(current, columnBonus, event.deltaY)
      if (columns === filters.columns) return
      const next = { ...search, columns }
      saveGalleryPreferences(pathname, next)
      void navigate({ to: '.', search: next, replace: true, resetScroll: false })
    }
    container.addEventListener('wheel', wheel, { passive: false })
    return () => container.removeEventListener('wheel', wheel)
  }, [
    filters.view,
    filters.columns,
    displayedColumns,
    columnBonus,
    search,
    pathname,
    navigate,
    visible.length,
  ])
  const grouping = filters.group ?? 'none'
  const groups =
    grouping === 'category'
      ? groupByCategory(visible, library.categories)
      : [{ id: 'all', name: '', games: visible }]
  const filtered = Boolean(
    filters.q ||
    (filters.scope && filters.scope !== 'all') ||
    filters.platform ||
    filters.status ||
    filters.machine ||
    filters.favorite ||
    filters.souvenir ||
    (filters.owned && filters.owned !== 'all'),
  )
  const sequence = groups.flatMap((group) => group.games.map((game) => game.id))
  return (
    <>
      {showStats && (
        <GalleryStats games={games} filters={filters} onSelect={update} universe={platformLocked} />
      )}
      {compactControls ? (
        <LibraryToolbar
          platformLocked={platformLocked}
          discovery={discovery}
          games={discovery ? games.filter((game) => game.discover) : games}
          filters={filters}
          update={update}
          onQueryChange={changeQuery}
          displayedColumns={displayedColumns}
          columnBonus={columnBonus}
          visibleCount={visible.length}
          reshuffle={reshuffle}
        />
      ) : (
        <GalleryToolbar
          games={games}
          filters={filters}
          update={update}
          platformLocked={platformLocked}
          pathname={pathname}
          displayedColumns={displayedColumns}
          columnBonus={columnBonus}
          visibleCount={visible.length}
          filtered={filtered}
          reshuffle={reshuffle}
        />
      )}
      {visible.length ? (
        <div className="gallery-groups" data-library-theme={filters.theme ?? '1'} ref={gallery}>
          {groups.map((group) => (
            <section key={group.id} className="gallery-category" aria-label={group.name || 'Jeux'}>
              {grouping === 'category' && (
                <h2 className="gallery-category-title">
                  {group.name}
                  <span>
                    {group.games.length} jeu{group.games.length > 1 ? 'x' : ''}
                  </span>
                </h2>
              )}
              <div
                className={
                  filters.view === 'list'
                    ? 'game-list'
                    : `game-grid ${group.games.every((g) => coverFormat(g.platform).wide) ? 'wide-grid' : 'mixed-grid'} ${typeof gridColumns === 'number' ? 'has-columns' : ''}`
                }
                style={
                  typeof gridColumns === 'number'
                    ? ({ '--gallery-columns': gridColumns } as CSSProperties)
                    : undefined
                }
              >
                {group.games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    compact={filters.view === 'list'}
                    sequence={sequence}
                    editDesire={filters.scope === 'discover'}
                    theme={filters.theme}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : filtered && games.length > 0 ? (
        <EmptyState
          title="Aucun jeu pour le moment."
          description="Essayez un autre titre ou élargissez vos filtres."
          add={false}
        />
      ) : (
        <EmptyState />
      )}
    </>
  )
}
