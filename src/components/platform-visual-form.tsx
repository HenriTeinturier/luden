import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ArrowUp, ArrowDown, ImagePlus, Check } from 'lucide-react'
import type { Platform } from '../lib/types'
import { platformVisualsSchema, type PlatformVisual } from '../lib/platform-visuals'
import { savePlatformVisualsFn } from '../server/functions'

export function PlatformVisualForm({
  platform,
  visuals,
}: {
  platform: Platform
  visuals: PlatformVisual[]
}) {
  const [items, setItems] = useState(visuals)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  function toggle(item: PlatformVisual) {
    setItems((previous) => {
      const next = previous.map((v) =>
        v.id === item.id ? { ...v, active: !v.active, isDefault: false } : { ...v },
      )
      const active = next.filter((v) => v.kind === item.kind && v.active)
      if (active.length && !active.some((v) => v.isDefault)) active[0].isDefault = true
      return next
    })
  }
  function move(id: string, delta: number) {
    const next = [...items]
    const index = next.findIndex((v) => v.id === id)
    const same = next.map((v, i) => ({ ...v, index: i })).filter((v) => v.kind === next[index].kind)
    const target = same[same.findIndex((v) => v.id === id) + delta]?.index
    if (target === undefined) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }
  async function upload(files: File[], kind: PlatformVisual['kind']) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      for (const file of files) {
        if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} : 12 Mo maximum par image.`)
        const form = new FormData()
        form.set('image', file)
        form.set('platformId', platform.id)
        form.set('kind', kind)
        const response = await fetch('/api/media', { method: 'POST', body: form })
        const result = (await response.json()) as PlatformVisual & { error?: string }
        if (!response.ok || result.error) throw new Error(result.error || 'Import impossible.')
        setItems((previous) => [
          ...previous,
          {
            ...result,
            active: true,
            isDefault: !previous.some((v) => v.kind === kind && v.active),
          },
        ])
      }
      setMessage('Images ajoutées. Enregistrez pour appliquer vos choix.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible. Réessayez.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page platform-visual-page">
      <Link to="/platforms/$platformId" params={{ platformId: platform.id }} className="text-link">
        <ArrowLeft size={16} /> Retour à l’univers
      </Link>
      <h1>Personnaliser {platform.name}</h1>
      <p className="muted">Un bandeau fixe et vos affiches à parcourir dans la sidebar.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          setMessage('')
          const parsed = platformVisualsSchema.safeParse({
            platformId: platform.id,
            visuals: items,
          })
          if (!parsed.success) {
            setError(parsed.error.issues[0].message)
            return
          }
          setBusy(true)
          try {
            const result = await savePlatformVisualsFn({ data: parsed.data })
            if (!result.ok) throw new Error(result.error)
            await router.invalidate({ sync: true })
            setMessage('Présentation de la plateforme enregistrée.')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Enregistrement impossible.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <fieldset disabled={busy} className="platform-visual-fields">
          {(['BANNER', 'POSTER'] as const).map((kind) => {
            const group = items.filter((v) => v.kind === kind)
            return (
              <section className="platform-visual-section" key={kind}>
                <div className="platform-visual-heading">
                  <h2>{kind === 'BANNER' ? 'Bandeaux' : 'Affiches'}</h2>
                  <span>
                    {group.length} image{group.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p>
                  {kind === 'BANNER'
                    ? 'Seul le bandeau par défaut est affiché. Il reste fixe et conserve ses proportions.'
                    : 'L’affiche par défaut ouvre la galerie. Les flèches parcourent uniquement les affiches actives, dans cet ordre. Aucun défilement automatique.'}
                </p>
                {!group.length && (
                  <p className="field-hint">
                    Aucune image ajoutée. L’identité de la plateforme sert de remplacement.
                  </p>
                )}
                <div className={`platform-visual-grid ${kind === 'BANNER' ? 'is-banners' : ''}`}>
                  {group.map((item, index) => (
                    <article
                      className={`platform-visual-item ${item.active ? '' : 'is-inactive'}`}
                      key={item.id}
                    >
                      <img
                        src={item.url}
                        alt={
                          item.caption ||
                          `${kind === 'BANNER' ? 'Bandeau' : 'Affiche'} ${index + 1}`
                        }
                      />
                      <div className="platform-visual-item-controls">
                        <label>
                          Nom de l’image
                          <input
                            maxLength={120}
                            value={item.caption}
                            onChange={(event) =>
                              setItems(
                                items.map((v) =>
                                  v.id === item.id ? { ...v, caption: event.target.value } : v,
                                ),
                              )
                            }
                          />
                        </label>
                        <div className="platform-visual-choices">
                          <label>
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={() => toggle(item)}
                            />{' '}
                            Active
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`default-${kind}`}
                              checked={item.isDefault}
                              onChange={() =>
                                setItems(
                                  items.map((v) =>
                                    v.kind === kind
                                      ? {
                                          ...v,
                                          isDefault: v.id === item.id,
                                          active: v.id === item.id || v.active,
                                        }
                                      : v,
                                  ),
                                )
                              }
                            />{' '}
                            Par défaut
                          </label>
                        </div>
                        <div className="platform-visual-order">
                          <span>
                            {item.active
                              ? item.isDefault
                                ? 'Par défaut'
                                : 'Active'
                              : 'Conservée · inactive'}
                          </span>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Monter ${item.caption || 'l’image'}`}
                            disabled={index === 0}
                            onClick={() => move(item.id, -1)}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Descendre ${item.caption || 'l’image'}`}
                            disabled={index === group.length - 1}
                            onClick={() => move(item.id, 1)}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <label className="platform-upload">
                  <ImagePlus size={19} />
                  <span>Ajouter {kind === 'BANNER' ? 'des bandeaux' : 'des affiches'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    aria-label={kind === 'BANNER' ? 'Ajouter des bandeaux' : 'Ajouter des affiches'}
                    onChange={(event) => {
                      const files = Array.from(event.currentTarget.files ?? [])
                      event.currentTarget.value = ''
                      if (files.length) void upload(files, kind)
                    }}
                  />
                </label>
              </section>
            )
          })}
          <p className="field-hint">
            JPG, PNG, WebP, AVIF ou GIF · 12 Mo par image. Les imports sont conservés immédiatement.
            Enregistrez pour appliquer l’activation, l’ordre et les images par défaut. Désactiver
            une image ne la supprime pas.
          </p>
          <button type="submit" className="button">
            <Check size={17} />
            {busy ? 'En cours…' : 'Enregistrer la présentation'}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </form>
    </div>
  )
}
