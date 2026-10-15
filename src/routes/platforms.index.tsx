import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Monitor, Plus, ArrowUpRight } from 'lucide-react'
import { PageHeading, PlatformCard, SectionHeading, Modal, useLibrary } from '../components/ui'
import { saveMachineFn } from '../server/functions'
const columnsStorageKey = 'luden:platforms:columns:v1'
const columnOptions = [1, 2, 3, 4]

export const Route = createFileRoute('/platforms/')({ component: Platforms })
function Platforms() {
  const { platforms, games, machines } = useLibrary()
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
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const gameCounts = new Map<string, number>()
  for (const game of games) {
    gameCounts.set(game.platformId, (gameCounts.get(game.platformId) ?? 0) + 1)
  }
  return (
    <div className="page platforms-index">
      <PageHeading title="Les machines de votre histoire" />
      <div className="platforms-toolbar">
        <div className="filter-tabs">
          {[
            'Toutes',
            'Ordinateurs',
            'Consoles',
            ...new Set(platforms.map((p) => p.family).filter((f) => f !== 'Ordinateurs')),
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
          .filter((p) =>
            family === 'Consoles'
              ? p.family !== 'Ordinateurs'
              : family === 'Toutes' || p.family === family,
          )
          .sort(
            (a, b) =>
              (gameCounts.get(b.id) ?? 0) - (gameCounts.get(a.id) ?? 0) ||
              a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }),
          )
          .map((p) => (
            <PlatformCard key={p.id} platform={p} count={gameCounts.get(p.id) ?? 0} />
          ))}
      </div>
      {['Toutes', 'Ordinateurs'].includes(family) && (
        <>
          <SectionHeading title="Mes PC, mes repères." />
          <p className="section-description">
            Un espace pour chaque PC qui vous a accompagné. Les jeux restent rattachés à la
            plateforme PC.
          </p>
          <div className="machine-grid">
            {machines.map((m) => (
              <Link
                key={m.id}
                to="/platforms/$platformId"
                params={{ platformId: 'pc' }}
                search={{ machine: m.id }}
                className="machine-card"
              >
                <Monitor size={28} strokeWidth={1.2} />
                <div>
                  <h3>{m.name}</h3>
                  <span>{games.filter((g) => g.machineId === m.id).length} jeux</span>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <button className="machine-card add-machine" onClick={() => setOpen(true)}>
              <Plus size={24} />
              <span>Ajouter un PC personnel</span>
            </button>
          </div>
        </>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Un PC de votre histoire"
        description="Donnez-lui un nom qui vous parle : Mon premier PC, La tour du salon…"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError('')
            try {
              const result = await saveMachineFn({ data: { name } })
              if (!result.ok) setError(result.error)
              else {
                await router.invalidate()
                setOpen(false)
                setName('')
              }
            } catch {
              setError('Impossible d’enregistrer ce PC.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <label>
            Nom du PC
            <input
              autoFocus
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon premier PC"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button className="button" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Ajouter ce PC'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
