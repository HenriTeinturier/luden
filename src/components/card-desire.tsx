import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { Game } from '../lib/types'
import { EditableStars } from './rating'
import { quickUpdateGameFn } from '../server/functions'

export function CardDesire({ game }: { game: Game }) {
  const router = useRouter()
  const saving = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(desire: number | null) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    try {
      const result = await quickUpdateGameFn({ data: { id: game.id, desire } })
      if (!result.ok) throw new Error(result.error)
      await router.invalidate({ sync: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  return (
    <div className="card-desire" role="group" aria-label={`Envie de jouer à ${game.title}`}>
      <EditableStars
        label="Envie de jouer"
        kind="desire"
        value={game.desire}
        disabled={busy}
        onChange={(value) => void save(value)}
      />
      {busy && <small role="status">Enregistrement…</small>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
