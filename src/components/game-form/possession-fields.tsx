import { Plus, Trash2 } from 'lucide-react'
import { stores } from '../../lib/platforms'
import { useLibrary } from '../ui'
import type { GameFieldsProps } from './field-types'

export function PossessionFields({ data, change }: GameFieldsProps) {
  const library = useLibrary()
  return (
    <section className="form-section">
      <div className="form-section-title">
        <span>03</span>
        <h2>Possessions & collections.</h2>
        <small>Facultatif</small>
      </div>
      <p className="field-hint">
        Posséder un jeu et le sélectionner dans une collection sont deux choix différents.
      </p>
      {data.possessions.map((possession, index) => (
        <div className="possession-row" key={index}>
          <select
            aria-label={`Format de la possession ${index + 1}`}
            value={possession.format}
            onChange={(e) =>
              change(
                'possessions',
                data.possessions.map((p, i) =>
                  i === index
                    ? { ...p, format: e.target.value as 'PHYSICAL' | 'DIGITAL', store: '' }
                    : p,
                ),
              )
            }
          >
            <option value="PHYSICAL">Physique</option>
            <option value="DIGITAL">Digital</option>
          </select>
          <select
            aria-label={`État de la possession ${index + 1}`}
            value={possession.state}
            onChange={(e) =>
              change(
                'possessions',
                data.possessions.map((p, i) =>
                  i === index ? { ...p, state: e.target.value as 'CURRENT' | 'PAST' } : p,
                ),
              )
            }
          >
            <option value="CURRENT">Je le possède</option>
            <option value="PAST">Je l’ai possédé</option>
          </select>
          {possession.format === 'DIGITAL' && (
            <select
              aria-label={`Boutique de la possession ${index + 1}`}
              value={possession.store}
              onChange={(e) =>
                change(
                  'possessions',
                  data.possessions.map((p, i) =>
                    i === index ? { ...p, store: e.target.value } : p,
                  ),
                )
              }
            >
              <option value="">Boutique (facultatif)</option>
              {stores.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="icon-button"
            aria-label="Retirer cette possession"
            onClick={() =>
              change(
                'possessions',
                data.possessions.filter((_, i) => i !== index),
              )
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-link add-row"
        onClick={() =>
          change('possessions', [
            ...data.possessions,
            { format: 'PHYSICAL', state: 'CURRENT', store: '' },
          ])
        }
      >
        <Plus size={16} />
        Ajouter une possession
      </button>
      <div className="collection-checkboxes">
        {library.collections.map((c) => (
          <label key={c.id} className="check-card">
            <input
              type="checkbox"
              checked={data.collectionIds.includes(c.id)}
              onChange={(e) =>
                change(
                  'collectionIds',
                  e.target.checked
                    ? [...data.collectionIds, c.id]
                    : data.collectionIds.filter((id) => id !== c.id),
                )
              }
            />
            <span>
              {c.name}
              <small>
                {c.kind === 'REAL'
                  ? 'Réelle · possession actuelle ou ancienne'
                  : 'Rêvée · votre vitrine idéale'}
              </small>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
