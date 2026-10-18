import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLibrary } from '../components/ui'
import {
  PlatformCategoriesField,
  PlatformCatalogField,
} from '../components/platform-classification-fields'
import { createPlatformFn } from '../server/functions'
import { createPlatformSchema } from '../lib/personal-platforms'
import type { PlatformCategory } from '../lib/platforms'
import { useUnsavedChanges } from '../components/use-unsaved-changes'

export const Route = createFileRoute('/platforms/new')({ component: NewPlatform })

function NewPlatform() {
  const { platforms } = useLibrary()
  const router = useRouter()
  const requestId = useRef<string | null>(null)
  const submitting = useRef(false)
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [family, setFamily] = useState('')
  const [dateLabel, setDateLabel] = useState('')
  const [categories, setCategories] = useState<PlatformCategory[]>(['COMPUTER'])
  const [catalogPlatformId, setCatalogPlatformId] = useState<string | null>('pc')
  const [personalPc, setPersonalPc] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { afterSave, leaveConfirmation } = useUnsavedChanges({
    dirty: !!(
      name ||
      shortName ||
      family ||
      dateLabel ||
      !personalPc ||
      catalogPlatformId !== 'pc' ||
      categories.length !== 1 ||
      categories[0] !== 'COMPUTER'
    ),
    busy,
  })
  return (
    <div className="page platform-new-page">
      <Link to="/platforms" className="text-link">
        <ArrowLeft size={16} /> Mes plateformes
      </Link>
      <h1>Ajouter une plateforme</h1>
      <p className="muted">
        Étape 1 sur 5 · Identité, puis carte, présentation des jeux, sidebar et récapitulatif.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          requestId.current ??= crypto.randomUUID()
          const parsed = createPlatformSchema.safeParse({
            requestId: requestId.current,
            name,
            shortName,
            family,
            dateLabel: dateLabel || null,
            categories,
            catalogPlatformId,
          })
          if (!parsed.success) {
            setError(parsed.error.issues[0].message)
            return
          }
          submitting.current = true
          setBusy(true)
          setError('')
          try {
            const result = await createPlatformFn({ data: parsed.data })
            if (!result.ok) throw new Error(result.error)
            await afterSave(async () => {
              await router.invalidate({ sync: true })
              await router.navigate({
                to: '/platforms/$platformId/edit',
                params: { platformId: result.data.platformId },
              })
            })
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'Création impossible. Vos champs ont été conservés.',
            )
          } finally {
            submitting.current = false
            setBusy(false)
          }
        }}
      >
        <fieldset disabled={busy} className="platform-new-fields platform-identity-fields">
          <div className="platform-mode-options">
            <label>
              <input
                type="radio"
                name="platform-kind"
                checked={personalPc}
                onChange={() => {
                  setPersonalPc(true)
                  setCategories(['COMPUTER'])
                  setCatalogPlatformId('pc')
                }}
              />
              PC personnel ou PC d’une époque
            </label>
            <label>
              <input
                type="radio"
                name="platform-kind"
                checked={!personalPc}
                onChange={() => {
                  setPersonalPc(false)
                  setCategories(['CONSOLE'])
                  setCatalogPlatformId(null)
                }}
              />
              Autre ordinateur ou console
            </label>
          </div>
          <label>
            Titre
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={personalPc ? 'Mon PC de 1998' : 'Le nom de votre plateforme'}
            />
          </label>
          <label>
            Nom court
            <input
              maxLength={30}
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              placeholder="Facultatif · utilisé dans les raccourcis"
            />
          </label>
          <label>
            Marque
            <input
              maxLength={50}
              value={family}
              onChange={(event) => setFamily(event.target.value)}
              placeholder="Facultative · Personnel par défaut"
              list="platform-brands"
            />
            <datalist id="platform-brands">
              {[
                ...new Set(
                  platforms
                    .map((platform) => platform.family)
                    .filter((value) => value !== 'Ordinateurs'),
                ),
              ].map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </label>
          <label>
            Année ou période
            <input
              maxLength={9}
              value={dateLabel}
              onChange={(event) => setDateLabel(event.target.value)}
              placeholder="1998 ou 1998–2002"
            />
          </label>
          <PlatformCategoriesField value={categories} onChange={setCategories} />
          <PlatformCatalogField
            value={catalogPlatformId}
            onChange={(id) => {
              setCatalogPlatformId(id)
              if (id === 'pc' && !categories.includes('COMPUTER'))
                setCategories([...categories, 'COMPUTER'])
            }}
            platforms={platforms}
          />
          <p className="field-hint">
            À l’écran suivant : logo PNG/WebP, fond, image de la machine, modèle de collection et
            sidebar. Le brouillon pourra être repris depuis Mes plateformes.
          </p>
          <button type="submit" className="button">
            {busy ? 'Création du brouillon…' : 'Suivant : carte'}
            <ArrowRight size={17} />
          </button>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
      {leaveConfirmation}
    </div>
  )
}
