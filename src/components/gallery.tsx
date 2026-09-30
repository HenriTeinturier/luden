import { coverFormat } from '../lib/presentation'
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { MegastarTrophy } from './megastar-trophy'
import { useEffect, useRef, useState } from 'react'
import { filterGames, type GallerySearch } from '../lib/gallery'
import type { Game } from '../lib/types'
import { playStatuses } from '../lib/platforms'
import { EmptyState, GameCard, useLibrary } from './ui'
import { groupByCategory } from '../lib/categories'
import {
  galleryPreferenceKey,
  restoreGalleryPreferences,
  saveGalleryPreferences,
} from '../lib/gallery-preferences'

export function Gallery({
  games,
  platformLocked = false,
  defaultScope = 'all',
}: {
  games: Game[]
  platformLocked?: boolean
  defaultScope?: GallerySearch['scope']
}) {
  const library = useLibrary()
  const search = useSearch({ strict: false }) as GallerySearch
  const filters = { ...search, scope: search.scope ?? defaultScope }
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const restoredPath = useRef<string | null>(null)
  useEffect(() => {
    if (restoredPath.current === pathname) return
    restoredPath.current = pathname
    try {
      const restored = restoreGalleryPreferences(
        localStorage.getItem(galleryPreferenceKey(pathname)),
        search,
      )
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
  }, [pathname, search, navigate])
  const [advanced, setAdvanced] = useState(false)
  const update = (patch: Partial<GallerySearch>) => {
    const next = { ...filters, ...patch }
    saveGalleryPreferences(pathname, next)
    void navigate({ to: '.', search: next, replace: true, resetScroll: false })
  }
  const visible = filterGames(games, filters)
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
        <div className="platform-scope" role="group" aria-label="Jeux à afficher">
          {(
            [
              ['played', 'Joués'],
              ['discover', 'À découvrir'],
              ['owned', 'Possédés'],
              ['all', 'Tous mes jeux'],
            ] as const
          ).map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              aria-pressed={filters.scope === scope}
              onClick={() => update({ scope, status: '', owned: 'all' })}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="platform-scope">
          <button
            type="button"
            className="favorites-filter"
            aria-label="Megastar — filtrer mes jeux cultes favoris"
            title="Afficher uniquement mes jeux Megastar (favoris)"
            aria-pressed={filters.favorite ?? false}
            onClick={() => update({ favorite: !filters.favorite })}
          >
            <MegastarTrophy />
            <span>Megastar</span>
          </button>
        </div>
        <div className="filter-search">
          <Search size={17} />
          <input
            aria-label="Filtrer les jeux"
            placeholder="Un titre, un souvenir, un genre…"
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
        <div className="gallery-results">
          <span aria-live="polite" aria-atomic="true">
            {visible.length} jeu{visible.length !== 1 ? 'x' : ''}
            {filtered && ` sur ${games.length}`}
          </span>
          {filtered && (
            <button
              className="text-link"
              onClick={() =>
                update({
                  q: '',
                  platform: '',
                  status: '',
                  machine: '',
                  favorite: false,
                  owned: 'all',
                  scope: 'all',
                })
              }
            >
              Réinitialiser les filtres <X size={13} />
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
          <select
            aria-label="Trier les jeux"
            value={filters.sort ?? 'recent'}
            onChange={(e) => update({ sort: e.target.value as GallerySearch['sort'] })}
          >
            <option value="recent">Derniers ajouts / modifiés</option>
            <option value="title">Titre A → Z</option>
            <option value="rating">Ma note</option>
            <option value="year">Année de sortie</option>
            <option value="desire">Mon envie</option>
          </select>
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
          <label className="check-inline">
            <input
              type="checkbox"
              checked={filters.favorite ?? false}
              onChange={(e) => update({ favorite: e.target.checked })}
            />
            Coups de cœur
          </label>
        </div>
      )}
      {visible.length ? (
        <div className="gallery-groups">
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
                    : `game-grid ${group.games.every((g) => coverFormat(g.platformId).wide) ? 'wide-grid' : 'mixed-grid'}`
                }
              >
                {group.games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    compact={filters.view === 'list'}
                    sequence={sequence}
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
