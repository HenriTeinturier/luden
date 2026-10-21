import { coverFormat } from '../lib/presentation'
import { useMatch, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import {
  Search,
  PackageCheck,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Columns3,
  PanelRightOpen,
  RotateCcw,
  Shuffle,
  X,
} from 'lucide-react'
import { MegastarTrophy } from './megastar-trophy'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useGameSelection } from './game-selection'
import { filterGames, galleryFilters, toggleGalleryScope, type GallerySearch } from '../lib/gallery'
import {
  galleryCardPositions,
  galleryKeyboardNeighbor,
  stepGalleryColumns,
} from '../lib/gallery-navigation'
import type { Game } from '../lib/types'
import { playStatuses } from '../lib/platforms'
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
  defaultScope = 'played',
  discovery = false,
}: {
  games: Game[]
  discovery?: boolean
  platformLocked?: boolean
  defaultScope?: GallerySearch['scope']
}) {
  const library = useLibrary()
  const search = useSearch({ strict: false }) as GallerySearch
  const filters = galleryFilters(search, defaultScope, discovery)
  const visible = filterGames(games, filters)
  const navigate = useNavigate()
  const router = useRouter()
  const pathname = useMatch({ strict: false, select: (match) => match.pathname })
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
  }, [pathname, search, navigate, defaultScope, router])
  const [advanced, setAdvanced] = useState(false)
  const update = (patch: Partial<GallerySearch>) => {
    const next = { ...filters, ...patch }
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
    (filters.owned && filters.owned !== 'all'),
  )
  const sequence = groups.flatMap((group) => group.games.map((game) => game.id))
  return (
    <>
      <div className="gallery-toolbar gallery-toolbar-scoped">
        <div
          className={`platform-scope ${discovery ? '' : 'gallery-scopes'}`}
          role="group"
          aria-label="Vue des jeux"
        >
          {discovery ? (
            <>
              <button
                type="button"
                aria-pressed={true}
                onClick={() => update({ scope: 'discover', status: '' })}
              >
                À découvrir
              </button>
              <button
                type="button"
                aria-pressed={filters.sort === 'desire'}
                title={
                  filters.sort === 'desire'
                    ? 'Revenir aux derniers ajouts / modifiés'
                    : 'Classer par note d’envie décroissante'
                }
                onClick={() =>
                  update({
                    sort: filters.sort === 'desire' ? 'recent' : 'desire',
                    randomSeed: undefined,
                  })
                }
              >
                Par envie ↓
              </button>
            </>
          ) : (
            (
              [
                ['played', 'Joués'],
                ['discover', 'À découvrir'],
                ['all', 'Tous'],
              ] as const
            ).map(([scope, label]) => (
              <button
                key={scope}
                type="button"
                aria-pressed={filters.scope === scope}
                title={
                  scope === 'all'
                    ? 'Tous les jeux, y compris ceux ni joués ni à découvrir'
                    : undefined
                }
                onClick={() => update(toggleGalleryScope(filters, scope))}
              >
                {label}
              </button>
            ))
          )}
        </div>
        <div className="gallery-refinements" role="group" aria-label="Filtres cumulables">
          <span className="gallery-refinements-label">Affiner</span>
          <button
            type="button"
            className="gallery-filter-switch"
            role="switch"
            aria-checked={filters.owned === 'current'}
            title="Limiter la vue aux jeux possédés actuellement"
            onClick={() => update({ owned: filters.owned === 'current' ? 'all' : 'current' })}
          >
            <PackageCheck size={18} aria-hidden="true" />
            Possédés
            <span className="filter-switch-track" aria-hidden="true" />
          </button>
          {!discovery && (
            <button
              type="button"
              className="gallery-filter-switch megastar-switch"
              role="switch"
              aria-checked={filters.favorite ?? false}
              title="Limiter la vue aux jeux Megastar (favoris)"
              onClick={() => update({ favorite: !filters.favorite })}
            >
              <MegastarTrophy />
              Megastar
              <span className="filter-switch-track" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="filter-search">
          <Search size={17} />
          <input
            aria-label="Filtrer les jeux"
            placeholder="Rechercher…"
            title="Rechercher un titre, un souvenir ou un genre"
            value={filters.q ?? ''}
            onChange={(e) => update({ q: e.target.value })}
          />
          {filters.q && (
            <button
              className="icon-button"
              aria-label="Effacer la recherche"
              onClick={() => update({ q: '' })}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="gallery-controls">
          <select
            aria-label="Regrouper les jeux"
            value={grouping}
            onChange={(e) => update({ group: e.target.value as GallerySearch['group'] })}
          >
            <option value="none">Sans regroupement</option>
            <option value="category">Par catégorie</option>
          </select>
          {!platformLocked && (
            <select
              aria-label="Filtrer par plateforme"
              value={filters.platform ?? ''}
              onChange={(e) => update({ platform: e.target.value })}
            >
              <option value="">Toutes les plateformes</option>
              {library.platforms
                .filter((p) => games.some((g) => g.platformId === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          )}
          <div className="gallery-sort">
            <select
              aria-label="Trier les jeux"
              value={filters.sort ?? 'recent'}
              onChange={(e) => {
                if (e.target.value === 'random') reshuffle()
                else
                  update({ sort: e.target.value as GallerySearch['sort'], randomSeed: undefined })
              }}
            >
              <option value="recent">Derniers ajouts / modifiés</option>
              <option value="title">Titre A → Z</option>
              <option value="rating">Ma note</option>
              <option value="year">Année de sortie</option>
              <option value="desire">Mon envie</option>
              <option value="random">Aléatoire</option>
            </select>
            {filters.sort === 'random' && (
              <button
                className="icon-button"
                aria-label="Remélanger les jeux"
                title="Remélanger les jeux"
                disabled={visible.length < 2}
                onClick={reshuffle}
              >
                <Shuffle size={17} />
              </button>
            )}
          </div>
          <button
            className={`icon-button ${advanced ? 'selected' : ''}`}
            aria-label="Afficher les filtres"
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={17} />
          </button>
          <div className="view-toggle">
            <button
              className={!filters.view || filters.view === 'grid' ? 'selected' : ''}
              aria-label="Vue galerie"
              aria-pressed={filters.view !== 'list'}
              onClick={() => update({ view: 'grid' })}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={filters.view === 'list' ? 'selected' : ''}
              aria-label="Vue compacte"
              aria-pressed={filters.view === 'list'}
              onClick={() => update({ view: 'list' })}
            >
              <List size={17} />
            </button>
          </div>
          <label
            className="gallery-density"
            title="Jaquettes par ligne : 4 à 10 avec la sidebar, 2 de plus sans elle. Ctrl + molette sur les jaquettes pour ajuster."
          >
            <Columns3 size={16} aria-hidden="true" />
            <select
              aria-label="Jaquettes par ligne"
              value={displayedColumns}
              disabled={filters.view === 'list'}
              onChange={(e) =>
                update({
                  columns:
                    e.target.value === 'auto' ? 'auto' : Number(e.target.value) - columnBonus,
                })
              }
            >
              <option value="auto">Auto</option>
              {Array.from({ length: 7 }, (_, i) => i + 4 + columnBonus).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="gallery-results">
          <span
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${visible.length} jeux affichés sur ${games.length}`}
            title={`${visible.length} jeux affichés sur ${games.length}`}
          >
            {visible.length}
            {filtered ? ` / ${games.length}` : ' jeux'}
          </span>
          {filtered && (
            <button
              type="button"
              className="icon-button gallery-reset"
              aria-label="Réinitialiser les filtres"
              title="Réinitialiser les filtres"
              onClick={() =>
                update({
                  q: '',
                  platform: '',
                  status: '',
                  machine: '',
                  favorite: false,
                  owned: 'all',
                  scope: discovery ? 'discover' : 'played',
                })
              }
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          )}
          {selection?.reopenSidebar && (
            <button
              id="reopen-sidebar"
              type="button"
              className="sidebar-reopen"
              aria-label="Afficher la sidebar de l’univers"
              title="Afficher la sidebar de l’univers · Flèches : parcourir les jeux · Entrée sur une jaquette : ouvrir sa fiche"
              onClick={selection.reopenSidebar}
            >
              <PanelRightOpen size={17} aria-hidden="true" />
              Sidebar
            </button>
          )}
        </div>
      </div>
      {advanced && (
        <div className="advanced-filters">
          <select
            aria-label="Statut de jeu"
            value={filters.status ?? ''}
            onChange={(e) => update({ status: e.target.value })}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(playStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Possession"
            value={filters.owned ?? 'all'}
            onChange={(e) => update({ owned: e.target.value as GallerySearch['owned'] })}
          >
            <option value="all">Toutes les possessions</option>
            <option value="current">Possédés actuellement</option>
            <option value="past">Possédés autrefois</option>
            <option value="none">Aucune possession</option>
          </select>
          {!discovery && (
            <label className="check-inline">
              <input
                type="checkbox"
                checked={filters.favorite ?? false}
                onChange={(e) => update({ favorite: e.target.checked })}
              />
              Coups de cœur
            </label>
          )}
        </div>
      )}
      {visible.length ? (
        <div className="gallery-groups" ref={gallery}>
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
                    editDesire={discovery}
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
