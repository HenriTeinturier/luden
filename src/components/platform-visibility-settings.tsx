import { belongsToPlatform } from '../lib/wish-platforms'
import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLibrary } from './ui'
import { setPlatformVisibilityFn } from '../server/functions'

export function PlatformVisibilitySettings() {
  const { platforms, games } = useLibrary()
  const router = useRouter()
  const saving = useRef(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function change(platformId: string, visible: boolean) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await setPlatformVisibilityFn({ data: { platformId, visible } })
      if (!result.ok) throw new Error(result.error)
      await router.invalidate({ sync: true })
      setMessage('Affichage enregistré.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Enregistrement impossible.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  return (
    <section className="settings-section">
      <h2>Plateformes affichées</h2>
      <p>
        Cochez les plateformes à afficher dans « Mes plateformes », sur l’accueil et dans le header
        (menu « Mes univers » et raccourcis). Vos jeux restent dans la bibliothèque et les
        collections, même si leur plateforme est masquée.
      </p>
      <div className="platform-visibility-options">
        {platforms.map((platform) => {
          const count = games.filter((game) => belongsToPlatform(game, platform.id)).length
          return (
            <label key={platform.id}>
              <input
                type="checkbox"
                checked={!platform.customization.hiddenFromPlatforms}
                disabled={busy}
                onChange={(event) => void change(platform.id, event.target.checked)}
              />
              <span>
                {platform.name}
                <small>
                  {count} jeu{count !== 1 ? 'x' : ''}
                </small>
              </span>
            </label>
          )
        })}
      </div>
      <p className="field-hint" role="status">
        {busy ? 'Enregistrement…' : message}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
