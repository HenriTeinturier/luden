import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useLibrary } from './ui'
import { useHomePlatforms } from './use-home-platforms'
import { selectHomePlatforms, type HomePlatformsPreference } from '../lib/home-platforms'

export function HomePlatformSettings() {
  const { platforms, games } = useLibrary()
  const { preference, ready, save } = useHomePlatforms()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const visible = platforms.filter((p) => !p.customization.hiddenFromPlatforms)
  // Keep empty slots in the editor; only populated choices enter the carousel.
  const ids = preference.ids.length ? preference.ids : ['', '', '', '']
  function change(next: HomePlatformsPreference) {
    try {
      save(next)
      setMessage('Choix enregistrés dans ce navigateur.')
      setError('')
    } catch {
      setError('Impossible de conserver ces choix : le stockage du navigateur est indisponible.')
    }
  }
  function move(index: number, offset: number) {
    const next = [...ids]
    ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
    change({ mode: 'manual', ids: next })
  }
  return (
    <section className="settings-section">
      <h2>Plateformes sur l’accueil</h2>
      <p>
        En mode Auto, les six plateformes visibles avec le plus de jeux sont retenues. En mode
        Manuel, choisissez leur ordre et ajoutez autant de choix que nécessaire.
      </p>
      <label className="home-platform-mode">
        Sélection des plateformes
        <select
          disabled={!ready}
          value={preference.mode}
          onChange={(event) => {
            const mode = event.target.value as HomePlatformsPreference['mode']
            change({
              mode,
              ids:
                mode === 'manual' && !preference.ids.length
                  ? selectHomePlatforms(platforms, games, { mode: 'auto', ids: [] })
                      .slice(0, 4)
                      .map((p) => p.id)
                  : preference.ids,
            })
          }}
        >
          <option value="auto">Auto — les 6 plateformes avec le plus de jeux</option>
          <option value="manual">Manuel — mes choix, dans mon ordre</option>
        </select>
      </label>
      {preference.mode === 'manual' && (
        <div className="home-platform-choices">
          {ids.map((id, index) => (
            <div className="home-platform-choice" key={index}>
              <label>
                Choix {index + 1}
                <select
                  value={id}
                  onChange={(event) =>
                    change({
                      mode: 'manual',
                      ids: ids.map((value, i) => (i === index ? event.target.value : value)),
                    })
                  }
                >
                  <option value="">Choisir une plateforme</option>
                  {id && !visible.some((p) => p.id === id) && (
                    <option value={id}>
                      {platforms.find((p) => p.id === id)?.name ?? 'Plateforme indisponible'}{' '}
                      (masquée)
                    </option>
                  )}
                  {visible
                    .filter((p) => p.id === id || !ids.includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="icon-button"
                aria-label={`Monter le choix ${index + 1}`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Descendre le choix ${index + 1}`}
                disabled={index === ids.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Retirer le choix ${index + 1}`}
                onClick={() => change({ mode: 'manual', ids: ids.filter((_, i) => i !== index) })}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={ids.includes('') || visible.every((p) => ids.includes(p.id))}
            onClick={() => change({ mode: 'manual', ids: [...ids, ''] })}
          >
            <Plus size={16} /> Ajouter un choix
          </button>
        </div>
      )}
      <p className="field-hint">
        L’accueil affiche 4, 2 ou 1 carte selon la place disponible. Les choix supplémentaires
        défilent toutes les 6 secondes, avec des commandes de navigation et de pause. Les
        plateformes masquées sont ignorées.
      </p>
      <p className="field-hint" role="status">
        {message}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
