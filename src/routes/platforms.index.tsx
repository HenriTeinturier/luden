import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { PageHeading, PlatformCard, useLibrary } from '../components/ui'
import { matchesPlatformFilter } from '../lib/platforms'
const columnsStorageKey = 'luden:platforms:columns:v1'
const columnOptions = [1, 2, 3, 4]

export const Route = createFileRoute('/platforms/')({ component: Platforms })
function Platforms() {
  const { platforms, games, platformDrafts } = useLibrary()
  const [family, setFamily] = useState('Toutes')
  const [columns, setColumns] = useState(2)
  const platformGrid = useRef<HTMLDivElement>(null)
  const lastWheel = useRef(-Infinity)
  const changeColumns = useCallback((value: number) => {
    if (!columnOptions.includes(value)) return
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
      const saved = Number(localStorage.getItem(columnsStorageKey))
      if (columnOptions.includes(saved)) setColumns(saved)
    } catch {
      // Keep the default when browser storage is unavailable.
    }
  }, [])
  const gameCounts = new Map<string, number>()
  for (const game of games) {
    gameCounts.set(game.platformId, (gameCounts.get(game.platformId) ?? 0) + 1)
  }
  return (
    <div className="page platforms-index">
      <PageHeading
        title="Les machines de votre histoire"
        action={
          <Link to="/platforms/new" className="button">
            <Plus size={18} />
            Ajouter une plateforme
          </Link>
        }
      />
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
          {[
            'Toutes',
            'Ordinateurs',
            'Consoles',
            'Portables',
            ...new Set(
              platforms
                .map((p) => p.family)
                .filter((f) => !['Toutes', 'Ordinateurs', 'Consoles', 'Portables'].includes(f)),
            ),
          ].map((f) => (
            <button
              key={f}
              className={f === family ? 'active' : ''}
              aria-pressed={f === family}
              onClick={() => setFamily(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label
          className="platforms-columns"
          title="Ctrl + molette sur les cartes pour ajuster les colonnes"
        >
          Colonnes
          <select value={columns} onChange={(event) => changeColumns(Number(event.target.value))}>
            {columnOptions.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        ref={platformGrid}
        className="platform-grid"
        style={{ '--platform-columns': columns } as CSSProperties}
      >
        {platforms
          .filter((p) => !p.customization.hiddenFromPlatforms && matchesPlatformFilter(p, family))
          .sort(
            (a, b) =>
              (gameCounts.get(b.id) ?? 0) - (gameCounts.get(a.id) ?? 0) ||
              a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }),
          )
          .map((p) => (
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
      {platforms.every((p) => p.customization.hiddenFromPlatforms) && platforms.length > 0 && (
        <p className="field-hint">
          Toutes les plateformes sont masquées.{' '}
          <Link to="/settings">Choisir les plateformes à afficher</Link>
        </p>
      )}
    </div>
  )
}
