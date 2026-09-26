import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { saveCollectionFn } from '../server/functions'
import { Modal } from './ui'
import type { Collection } from '../lib/types'

export function CollectionForm({
  open,
  onOpenChange,
  collection,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  collection?: Collection
}) {
  const [name, setName] = useState(collection?.name ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [kind, setKind] = useState<'REAL' | 'DREAM'>(collection?.kind ?? 'REAL')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={collection ? 'Votre collection évolue' : 'Une nouvelle vitrine'}
      description="Un ensemble de jeux qui a du sens pour vous."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            const result = await saveCollectionFn({
              data: { id: collection?.id, name, description, kind },
            })
            if (!result.ok) setError(result.error)
            else {
              await router.invalidate()
              onOpenChange(false)
              if (!collection) {
                setName('')
                setDescription('')
              }
            }
          } catch {
            setError('Impossible d’enregistrer cette collection.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <label>
          Nom de la collection
          <input
            autoFocus
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Les trésors de mon enfance"
          />
        </label>
        <label>
          En quelques mots
          <textarea
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce qui réunit ces jeux…"
          />
        </label>
        <div className="collection-kind-options">
          <label className={kind === 'REAL' ? 'selected' : ''}>
            <input
              type="radio"
              name="kind"
              value="REAL"
              checked={kind === 'REAL'}
              onChange={() => setKind('REAL')}
            />
            <strong>Réelle</strong>
            <span>Des jeux possédés aujourd’hui ou autrefois.</span>
          </label>
          <label className={kind === 'DREAM' ? 'selected' : ''}>
            <input
              type="radio"
              name="kind"
              value="DREAM"
              checked={kind === 'DREAM'}
              onChange={() => setKind('DREAM')}
            />
            <strong>Rêvée</strong>
            <span>Votre collection idéale, sans obligation d’achat.</span>
          </label>
        </div>
        <p className="field-hint">
          Cette collection reste privée. Le partage viendra dans une version ultérieure.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="button" disabled={busy}>
            {busy ? 'Enregistrement…' : collection ? 'Enregistrer' : 'Créer ma collection'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
