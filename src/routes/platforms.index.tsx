import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Monitor, Plus, ArrowUpRight } from 'lucide-react'
import { PageHeading, PlatformCard, SectionHeading, Modal, useLibrary } from '../components/ui'
import { saveMachineFn } from '../server/functions'
export const Route = createFileRoute('/platforms/')({ component: Platforms })
function Platforms() {
  const { platforms, games, machines } = useLibrary()
  const [family, setFamily] = useState('Toutes')
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
    <div className="page">
      <PageHeading
        eyebrow="LES MACHINES DE VOTRE HISTOIRE"
        title="Des univers à retrouver."
        description="De la première manette aux mondes d’aujourd’hui."
      />
      <div className="filter-tabs">
        {['Toutes', ...new Set(platforms.map((p) => p.family))].map((f) => (
          <button key={f} className={f === family ? 'active' : ''} onClick={() => setFamily(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="platform-grid">
        {platforms
          .filter((p) => family === 'Toutes' || p.family === family)
          .sort(
            (a, b) =>
              Number(gameCounts.has(b.id)) - Number(gameCounts.has(a.id)) ||
              a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }),
          )
          .map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              count={gameCounts.get(p.id) ?? 0}
            />
          ))}
      </div>
      <SectionHeading title="Mes PC, mes repères." />
      <p className="section-description">
        Un espace pour chaque PC qui vous a accompagné. Les jeux restent rattachés à la plateforme
        PC.
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
