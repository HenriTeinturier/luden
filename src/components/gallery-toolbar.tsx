import { useState } from 'react'
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
import { useLibrary } from './ui'
import { useGameSelection } from './game-selection'
import { toggleGalleryScope, needsSorting, type GallerySearch } from '../lib/gallery'
import { playStatuses } from '../lib/platforms'
import type { Game } from '../lib/types'

// Universe and collection controls retain their existing capabilities.
export function GalleryToolbar({
  games,
  filters,
  update,
  platformLocked,
  pathname,
  displayedColumns,
  columnBonus,
  visibleCount,
  filtered,
  reshuffle,
}: {
  games: Game[]
  filters: GallerySearch
  update: (patch: Partial<GallerySearch>) => void
  platformLocked: boolean
  pathname: string
  displayedColumns: number | 'auto'
  columnBonus: number
  visibleCount: number
  filtered: boolean
  reshuffle: () => void
}) {
  const library = useLibrary()
  const selection = useGameSelection()
  const [advanced, setAdvanced] = useState(false)
  const grouping = filters.group ?? 'none'
  const sortingCount = games.filter(needsSorting).length
  return (
    <>
      <div className="gallery-toolbar gallery-toolbar-scoped">
        <div className="platform-scope gallery-scopes" role="group" aria-label="Vue des jeux">
          {(
            [
              ['all', 'Tous'],
              ['played', 'Joués'],
              ['discover', 'Mes envies'],
            ] as const
          ).map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              aria-pressed={filters.scope === scope}
              title={scope === 'all' ? 'Tous les jeux, y compris ceux à trier' : undefined}
              onClick={() => update(toggleGalleryScope(filters, scope))}
            >
              {label}
            </button>
          ))}
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
        </div>
        {(sortingCount > 0 || filters.scope === 'unassigned') && (
          <button
            type="button"
            className="gallery-sorting-link"
            aria-pressed={filters.scope === 'unassigned'}
            title="Jeux ni joués, ni dans mes envies, ni gardés en souvenir, possédés ou non. Le compteur inclut tous les jeux à trier de cette galerie avant les autres filtres."
            onClick={() => update(toggleGalleryScope(filters, 'unassigned'))}
          >
            À trier · {sortingCount}
          </button>
        )}
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
                disabled={visibleCount < 2}
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
          {['/library', '/discover'].includes(pathname.replace(/\/$/, '')) && (
            <select
              aria-label="Thème visuel de la galerie"
              value={filters.theme ?? '1'}
              onChange={(event) => update({ theme: event.target.value as '1' | '2' })}
            >
              <option value="1">Thème 1 · Classique</option>
              <option value="2">Thème 2 · Boîtes libres</option>
            </select>
          )}
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
            aria-label={`${visibleCount} jeux affichés sur ${games.length}`}
            title={`${visibleCount} jeux affichés sur ${games.length}`}
          >
            {`${visibleCount}${filtered ? ` / ${games.length}` : ' jeux'}`}
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
                  souvenir: false,
                  owned: 'all',
                  scope: 'all',
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
          <label className="check-inline">
            <input
              type="checkbox"
              checked={filters.souvenir ?? false}
              onChange={(e) => update({ souvenir: e.target.checked })}
            />
            Souvenirs uniquement
          </label>
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
    </>
  )
}
