import { ChevronDown, Search, Settings2, Shuffle, X } from 'lucide-react'
import { useLibrary } from './ui'
import type { Game } from '../lib/types'
import type { GallerySearch } from '../lib/gallery'

export function LibraryToolbar({
  games,
  discovery = false,
  filters,
  update,
  onQueryChange,
  displayedColumns,
  columnBonus,
  visibleCount,
  reshuffle,
}: {
  discovery?: boolean
  games: Game[]
  filters: GallerySearch
  update: (patch: Partial<GallerySearch>) => void
  onQueryChange: (value: string) => void
  displayedColumns: number | 'auto'
  columnBonus: number
  visibleCount: number
  reshuffle: () => void
}) {
  const { platforms } = useLibrary()
  return (
    <div className="library-tools" role="group" aria-label="Rechercher et présenter les jeux">
      <div className="library-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          aria-label="Rechercher dans cette vue"
          placeholder="Rechercher dans cette vue…"
          value={filters.q ?? ''}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {filters.q && (
          <button
            type="button"
            className="icon-button"
            aria-label="Effacer la recherche"
            onClick={() => onQueryChange('')}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {filters.q?.trim() && (
        <span className="library-search-count" role="status">
          {visibleCount} résultat{visibleCount !== 1 ? 's' : ''}
        </span>
      )}
      <div className="library-tool-actions">
        <select
          aria-label="Filtrer par plateforme"
          value={filters.platform ?? ''}
          onChange={(event) => update({ platform: event.target.value })}
        >
          <option value="">Toutes les plateformes</option>
          {platforms
            .filter((p) => games.some((g) => g.platformId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Trier les jeux"
          value={filters.sort ?? 'recent'}
          onChange={(event) => {
            if (event.target.value === 'random') reshuffle()
            else
              update({ sort: event.target.value as GallerySearch['sort'], randomSeed: undefined })
          }}
        >
          <option value="recent">Tri : Récent</option>
          <option value="title">Tri : Titre A → Z</option>
          <option value="platform">Tri : Plateforme</option>
          {!discovery && <option value="rating">Tri : Note</option>}
          <option value="year">Tri : Année</option>
          <option value="desire">Tri : Envie</option>
          <option value="random">Tri : Aléatoire</option>
        </select>
        {filters.sort === 'random' && (
          <button
            type="button"
            className="icon-button"
            aria-label="Remélanger les jeux"
            disabled={visibleCount < 2}
            onClick={reshuffle}
          >
            <Shuffle size={17} />
          </button>
        )}
        <details
          className="library-presentation"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false
              event.currentTarget.querySelector('summary')?.focus()
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
          }}
        >
          <summary>
            <Settings2 size={16} aria-hidden="true" /> Présentation{' '}
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <div className="library-presentation-menu">
            <label>
              Thème
              <select
                aria-label="Thème visuel"
                value={filters.theme ?? '1'}
                onChange={(event) => update({ theme: event.target.value as '1' | '2' })}
              >
                <option value="1">Classique</option>
                <option value="2">Vitrine</option>
              </select>
            </label>
            <label>
              Colonnes
              <select
                aria-label="Nombre de colonnes"
                value={displayedColumns}
                onChange={(event) =>
                  update({
                    columns:
                      event.target.value === 'auto'
                        ? 'auto'
                        : Number(event.target.value) - columnBonus,
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
            <small>Ctrl + molette sur les jeux pour ajuster les colonnes.</small>
          </div>
        </details>
      </div>
    </div>
  )
}
