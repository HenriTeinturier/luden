import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { useLibrary } from './ui'
import { saveCategoriesFn } from '../server/functions'

export function CategorySettings() {
  const { categories } = useLibrary()
  const [items, setItems] = useState<{ id?: string; name: string; key: string }[]>(() =>
    categories.map((item) => ({ id: item.id, name: item.name, key: item.id })),
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const move = (index: number, offset: number) => {
    const next = [...items]
    ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
    setItems(next)
  }
  return (
    <section className="settings-section">
      <h2>Mes catégories de jeux</h2>
      <p>
        Renomme et ordonne tes catégories. Cet ordre sera utilisé dans les galeries regroupées, sur
        toutes les plateformes.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setBusy(true)
          setMessage('')
          try {
            const result = await saveCategoriesFn({
              data: items.map(({ id, name }) => ({ id, name })),
            })
            if (!result.ok) setMessage(result.error)
            else {
              setItems(result.data.map((item) => ({ id: item.id, name: item.name, key: item.id })))
              await router.invalidate()
              setMessage('Catégories enregistrées.')
            }
          } catch {
            setMessage('Impossible d’enregistrer les catégories.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <fieldset className="category-editor" disabled={busy}>
          {items.map((item, index) => (
            <div className="category-editor-row" key={item.key}>
              <input
                aria-label={`Nom de la catégorie ${index + 1}`}
                required
                maxLength={80}
                value={item.name}
                onChange={(event) =>
                  setItems(
                    items.map((entry, i) =>
                      i === index ? { ...entry, name: event.target.value } : entry,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon-button"
                disabled={index === 0}
                aria-label={`Monter ${item.name}`}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={index === items.length - 1}
                aria-label={`Descendre ${item.name}`}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={18} />
              </button>
              {!item.id && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setItems(items.filter((entry) => entry.key !== item.key))}
                >
                  Annuler
                </button>
              )}
            </div>
          ))}
          <div className="category-editor-actions">
            <button
              type="button"
              className="button secondary"
              disabled={items.length >= 50}
              onClick={() => setItems([...items, { key: crypto.randomUUID(), name: '' }])}
            >
              <Plus size={16} />
              Ajouter une catégorie
            </button>
            <button className="button" type="submit">
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </fieldset>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  )
}
