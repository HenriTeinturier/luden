import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Plus, Pencil, Settings2, ChevronDown } from 'lucide-react'
import { PlatformCard, useLibrary } from '../components/ui'
import { matchesPlatformFilter } from '../lib/platforms'
import { platformReleases } from '../lib/platform-releases'
import { gamePlatformIds } from '../lib/wish-platforms'
const columnsStorageKey = 'luden:platforms:columns:v1'
const columnOptions = [1, 2, 3, 4]

export const Route = createFileRoute('/platforms/')({ component: Platforms })
function Platforms() {
  const { platforms, games, platformDrafts } = useLibrary()
  const [category, setCategory] = useState('Toutes')
  const [family, setFamily] = useState('')
  const [sort, setSort] = useState('count')
  const [columns, setColumns] = useState<number | 'auto'>('auto')
  const platformGrid = useRef<HTMLDivElement>(null)
  const lastWheel = useRef(-Infinity)
  const changeColumns = useCallback((value: number | 'auto') => {
    if (value !== 'auto' && !columnOptions.includes(value)) return
    setColumns(value)
    try {
      localStorage.setItem(columnsStorageKey, String(value))
    } catch {
      // The layout stays usable without persistent storage.
    }
  }, [])
  useEffect(() => {
    const grid = platformGrid.current
    if (!grid) return
    function wheel(event: WheelEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || !event.deltaY) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (document.activeElement?.closest('input, textarea, select, [contenteditable="true"]'))
        return
      if (!grid!.getBoundingClientRect().width) return
      // Replace browser zoom only over the cards, just like the game library.
      event.preventDefault()
      const now = performance.now()
      if (now - lastWheel.current < 160) return
      lastWheel.current = now
      const displayed = getComputedStyle(grid!).gridTemplateColumns.split(' ').length
      const next = Math.max(1, Math.min(4, displayed + Math.sign(event.deltaY)))
      if (next !== columns) changeColumns(next)
    }
    grid.addEventListener('wheel', wheel, { passive: false })
    return () => grid.removeEventListener('wheel', wheel)
  }, [columns, changeColumns])
  useEffect(() => {
    try {
      const stored = localStorage.getItem(columnsStorageKey)
      const saved = stored === 'auto' ? 'auto' : Number(stored)
      if (saved === 'auto' || columnOptions.includes(saved)) setColumns(saved)
    } catch {
      // Keep the default when browser storage is unavailable.
    }
  }, [])
  const gameCounts = new Map<string, number>()
  for (const game of games) {
    for (const id of gamePlatformIds(game)) gameCounts.set(id, (gameCounts.get(id) ?? 0) + 1)
  }
  const visiblePlatforms = platforms.filter((p) => !p.customization.hiddenFromPlatforms)
  const families = [...new Set(visiblePlatforms.map((p) => p.family))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  )
  // A renamed family must not leave an obsolete filter hiding every platform.
  const activeFamily = families.includes(family) ? family : ''
  const activity = new Map<string, number>()
  for (const game of games)
    for (const id of gamePlatformIds(game))
      activity.set(id, Math.max(activity.get(id) ?? 0, Date.parse(game.updatedAt)))
  const filteredPlatforms = visiblePlatforms
    .filter(
      (p) => matchesPlatformFilter(p, category) && (!activeFamily || p.family === activeFamily),
    )
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true })
      if (sort === 'name') return byName
      if (sort === 'year')
        return (
          (Number.parseInt(
            a.customization.dateLabel ?? String(platformReleases[a.id]?.year ?? a.era),
          ) || Infinity) -
            (Number.parseInt(
              b.customization.dateLabel ?? String(platformReleases[b.id]?.year ?? b.era),
            ) || Infinity) || byName
        )
      if (sort === 'recent') return (activity.get(b.id) ?? 0) - (activity.get(a.id) ?? 0) || byName
      return (gameCounts.get(b.id) ?? 0) - (gameCounts.get(a.id) ?? 0) || byName
    })
  return (
    <div className="page platforms-index">
      {platformDrafts.length > 0 && (
        <section className="platform-drafts">
          <h2>Créations en cours</h2>
          <p className="muted">
            Reprenez les visuels et la présentation avant d’ajouter ces plateformes à votre liste.
          </p>
          <div>
            {platformDrafts.map((platform) => (
              <Link
                key={platform.id}
                to="/platforms/$platformId/edit"
                params={{ platformId: platform.id }}
                className="button secondary"
              >
                <Pencil size={15} />
                Reprendre {platform.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="platforms-toolbar">
        <div className="filter-tabs">
          {['Toutes', 'Ordinateurs', 'Consoles', 'Portables'].map((f) => (
            <button
              key={f}
              className={f === category ? 'active' : ''}
              aria-pressed={f === category}
              onClick={() => setCategory(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="library-tool-actions">
          <select
            aria-label="Filtrer par constructeur ou famille"
            value={activeFamily}
            onChange={(event) => setFamily(event.target.value)}
          >
            <option value="">Tous les constructeurs</option>
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            aria-label="Trier les plateformes"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="count">Tri : Nombre de jeux</option>
            <option value="name">Tri : Nom A → Z</option>
            <option value="year">Tri : Année</option>
            <option value="recent">Tri : Activité récente</option>
          </select>
          <details
            className="library-presentation"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.open = false
                event.currentTarget.querySelector('summary')?.focus()
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                event.currentTarget.open = false
            }}
          >
            <summary>
              <Settings2 size={16} aria-hidden="true" /> Présentation{' '}
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="library-presentation-menu">
              <label>
                Colonnes
                <select
                  value={columns}
                  onChange={(event) =>
                    changeColumns(
                      event.target.value === 'auto' ? 'auto' : Number(event.target.value),
                    )
                  }
                >
                  <option value="auto">Auto</option>
                  {columnOptions.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
              <small>Ctrl + molette sur les cartes pour ajuster les colonnes.</small>
            </div>
          </details>
          <Link to="/platforms/new" className="button secondary platform-add">
            <Plus size={16} /> Ajouter une plateforme
          </Link>
        </div>
      </div>
      <div
        ref={platformGrid}
        className="platform-grid"
        style={{ '--platform-columns': columns === 'auto' ? 4 : columns } as CSSProperties}
      >
        {filteredPlatforms.map((p) => (
          <div key={p.id} className="platform-card-entry">
            <PlatformCard platform={p} count={gameCounts.get(p.id) ?? 0} />
            <Link
              to="/platforms/$platformId/edit"
              params={{ platformId: p.id }}
              className="platform-card-edit icon-button"
              aria-label={`Personnaliser ${p.name}`}
              title={`Personnaliser ${p.name}`}
            >
              <Pencil size={16} />
            </Link>
          </div>
        ))}
      </div>
      {filteredPlatforms.length === 0 && visiblePlatforms.length > 0 && (
        <p className="field-hint">
          Aucune plateforme pour cette sélection.{' '}
          <button
            className="button secondary"
            onClick={() => {
              setCategory('Toutes')
              setFamily('')
            }}
          >
            Afficher toutes les plateformes
          </button>
        </p>
      )}
      {platforms.every((p) => p.customization.hiddenFromPlatforms) && platforms.length > 0 && (
        <p className="field-hint">
          Toutes les plateformes sont masquées.{' '}
          <Link to="/settings">Choisir les plateformes à afficher</Link>
        </p>
      )}
    </div>
  )
}
