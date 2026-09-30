import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Star, Trash2 } from 'lucide-react'
import { mediaCategories, orderImages, type ImageInput } from '../../lib/media'
import {
  discardImageFn,
  igdbImagesFn,
  importIgdbImageFn,
  importImageUrlFn,
} from '../../server/functions'
import { useLibrary } from '../ui'
import { LinkFields } from './link-fields'
import type { GameFieldsProps } from './field-types'
import { VisualFields } from './visual-fields'
import { defaultPresentation, readPresentation, type VisualRole } from '../../lib/game-visuals'

type Asset = Extract<Awaited<ReturnType<typeof igdbImagesFn>>, { ok: true }>['data'][number]
const groups = [
  { title: 'Jaquettes', categories: ['COVER'] },
  { title: 'Images du jeu', categories: ['SCREENSHOT'] },
  { title: 'Boîte', categories: ['BOX'] },
  { title: 'Support', categories: ['MEDIA'] },
  { title: 'Documents / divers', categories: ['DOCUMENT', 'OTHER'] },
  { title: 'Publicités', categories: ['ADVERTISEMENT'] },
]

export function MediaFields({
  data,
  change,
  onBusyChange,
}: GameFieldsProps & { onBusyChange: (busy: boolean) => void }) {
  const { config } = useLibrary()
  const items = data.media ?? []
  const [category, setCategory] = useState<ImageInput['category']>('COVER')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [urlError, setUrlError] = useState('')
  const urlErrorId = useId()
  const [assets, setAssets] = useState<{ gameId: number; images: Asset[] } | null>(null)
  const [choices, setChoices] = useState<Record<string, ImageInput['category']>>({})
  const [imported, setImported] = useState<Record<string, string>>({})
  const pending = useRef(new Set<string>())
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    const uploads = pending.current
    return () => {
      mounted.current = false
      // Saved files are still referenced and therefore protected by the server.
      for (const id of uploads) void discardImageFn({ data: id }).catch(() => undefined)
    }
  }, [])

  const update = (next: ImageInput[]) => change('media', orderImages(next))
  async function run(action: () => Promise<void>, errorTarget: 'general' | 'url' = 'general') {
    setBusy(true)
    onBusyChange(true)
    setError('')
    setUrlError('')
    try {
      await action()
    } catch (e) {
      if (mounted.current) {
        const reportError = errorTarget === 'url' ? setUrlError : setError
        reportError(e instanceof Error ? e.message : 'Import impossible.')
      }
    } finally {
      if (mounted.current) {
        setBusy(false)
        onBusyChange(false)
      }
    }
  }
  function added(id: string, kind = category, role?: VisualRole) {
    if (!mounted.current) {
      void discardImageFn({ data: id }).catch(() => undefined)
      return
    }
    pending.current.add(id)
    update([
      ...items,
      {
        mediaId: id,
        category: kind,
        caption: '',
        position: items.length,
        isPrimary: items.length === 0,
      },
    ])
    if (role)
      change('presentation', {
        ...readPresentation(data.presentation),
        [role]: id,
        ...(role === 'background' ? { sidebarCrop: defaultPresentation().sidebarCrop } : {}),
      })
  }
  function remove(id: string) {
    update(items.filter((m) => m.mediaId !== id))
    if (pending.current.has(id)) {
      void discardImageFn({ data: id }).catch(() => undefined)
      pending.current.delete(id)
    }
  }
  function move(id: string, targetId: string) {
    const next = [...items]
    const from = next.findIndex((m) => m.mediaId === id),
      to = next.findIndex((m) => m.mediaId === targetId)
    ;[next[from], next[to]] = [next[to], next[from]]
    update(next)
  }
  return (
    <section className="form-section media-editor">
      <div className="form-section-title">
        <span>04</span>
        <h2>Médias & liens.</h2>
        <small>Facultatif</small>
      </div>
      <p className="field-hint">
        Une jaquette, une boîte, un souvenir en image. L’étoile choisit l’image affichée dans votre
        bibliothèque.
      </p>
      <fieldset disabled={busy}>
        <VisualFields
          data={data}
          change={change}
          disabled={busy || !config.mediaConfigured || items.length >= 100}
          upload={async (file, role) => {
            let success = false
            await run(async () => {
              if (items.length >= 100) throw new Error('100 images maximum par fiche.')
              if (file.size > 12 * 1024 * 1024) throw new Error('12 Mo maximum par image.')
              const body = new FormData()
              body.append('image', file)
              const response = await fetch('/api/media', { method: 'POST', body })
              const result = (await response.json()) as { id?: string; error?: string }
              if (!response.ok || !result.id) throw new Error(result.error ?? 'Import impossible.')
              added(
                result.id,
                role === 'box' ? 'BOX' : role === 'support' ? 'MEDIA' : 'OTHER',
                role,
              )
              success = true
            })
            return success
          }}
        />
        <div className="media-import-toolbar">
          <label>
            Ranger la nouvelle image dans
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ImageInput['category'])}
            >
              {Object.entries(mediaCategories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label
            className={`button secondary upload-button ${!config.mediaConfigured ? 'disabled' : ''}`}
          >
            <ImagePlus size={16} /> Depuis mon ordinateur
            <input
              type="file"
              aria-label="Choisir une image sur mon ordinateur"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={!config.mediaConfigured}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                void run(async () => {
                  if (items.length >= 100) throw new Error('100 images maximum par fiche.')
                  if (file.size > 12 * 1024 * 1024) throw new Error('12 Mo maximum par image.')
                  const body = new FormData()
                  body.append('image', file)
                  const response = await fetch('/api/media', { method: 'POST', body })
                  const result = (await response.json()) as { id?: string; error?: string }
                  if (!response.ok || !result.id)
                    throw new Error(result.error ?? 'Import impossible.')
                  added(result.id)
                })
              }}
            />
          </label>
        </div>
        <div className="media-url-row">
          <label>
            Lien direct vers une image
            <input
              type="url"
              placeholder="https://…/image.jpg"
              value={url}
              maxLength={2048}
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? urlErrorId : undefined}
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlError('')
              }}
            />
          </label>
          <button
            type="button"
            className="button secondary"
            disabled={!url.trim() || !config.mediaConfigured || items.length >= 100}
            onClick={() =>
              void run(async () => {
                const result = await importImageUrlFn({ data: url })
                if (!result.ok) throw new Error(result.error)
                added(result.data.id)
                setUrl('')
              }, 'url')
            }
          >
            Importer le lien
          </button>
        </div>
        {urlError && (
          <p id={urlErrorId} className="form-error" role="alert">
            {urlError}
          </p>
        )}
        <p className="field-hint">
          Copie locale · JPG, PNG, WebP, GIF, AVIF · 12 Mo max. · proportions conservées.
        </p>
        {!config.mediaConfigured && (
          <p className="inline-notice">
            Renseignez LUDEN_DATA_DIR dans .env pour importer des images. Les liens restent
            disponibles.
          </p>
        )}
        {data.igdbId && config.igdbConfigured && (
          <div className="igdb-media-picker">
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                void run(async () => {
                  const result = await igdbImagesFn({ data: data.igdbId! })
                  if (!result.ok) throw new Error(result.error)
                  setAssets({ gameId: data.igdbId!, images: result.data })
                })
              }
            >
              Parcourir les images IGDB
            </button>
            {assets?.gameId === data.igdbId && (
              <>
                <p className="field-hint">
                  Choisissez la catégorie avant d’ajouter chaque image. Les jaquettes régionales
                  disponibles sont incluses.
                </p>
                <div className="igdb-asset-grid">
                  {assets.images.map((asset) => {
                    const already = items.some((m) => m.mediaId === imported[asset.imageId])
                    return (
                      <article key={asset.imageId} className="igdb-asset">
                        <a
                          href={asset.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Agrandir : ${asset.title}`}
                        >
                          <img
                            src={asset.previewUrl}
                            alt={asset.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                        <small>{asset.title}</small>
                        <label>
                          Catégorie
                          <select
                            value={choices[asset.imageId] ?? asset.category}
                            onChange={(e) =>
                              setChoices({
                                ...choices,
                                [asset.imageId]: e.target.value as ImageInput['category'],
                              })
                            }
                          >
                            {Object.entries(mediaCategories).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={already || !config.mediaConfigured || items.length >= 100}
                          onClick={() =>
                            void run(async () => {
                              const result = await importIgdbImageFn({
                                data: { gameId: data.igdbId!, imageId: asset.imageId },
                              })
                              if (!result.ok) throw new Error(result.error)
                              added(result.data.id, choices[asset.imageId] ?? asset.category)
                              setImported((previous) => ({
                                ...previous,
                                [asset.imageId]: result.data.id,
                              }))
                            })
                          }
                        >
                          {already ? 'Ajoutée' : 'Ajouter cette image'}
                        </button>
                      </article>
                    )
                  })}
                </div>
                {!assets.images.length && (
                  <p className="muted">Aucune image disponible sur cette fiche IGDB.</p>
                )}
              </>
            )}
          </div>
        )}
        {groups.map((group) => {
          const images = items.filter((m) => group.categories.includes(m.category))
          return (
            <details className="media-group" key={group.title} open={images.length > 0}>
              <summary>
                {group.title}
                <span>{images.length}</span>
              </summary>
              <div className="media-edit-grid">
                {images.map((item, index) => (
                  <article
                    key={item.mediaId}
                    className={`media-edit-card ${item.isPrimary ? 'primary' : ''}`}
                  >
                    <a
                      href={`/media/${item.mediaId}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Agrandir ${item.caption || 'l’image'}`}
                    >
                      <img
                        src={`/media/${item.mediaId}`}
                        alt={item.caption || mediaCategories[item.category]}
                        loading="lazy"
                      />
                    </a>
                    <label>
                      Légende
                      <input
                        value={item.caption}
                        maxLength={500}
                        placeholder="Facultative"
                        onChange={(e) =>
                          update(
                            items.map((m) =>
                              m.mediaId === item.mediaId ? { ...m, caption: e.target.value } : m,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Catégorie
                      <select
                        value={item.category}
                        onChange={(e) =>
                          update(
                            items.map((m) =>
                              m.mediaId === item.mediaId
                                ? { ...m, category: e.target.value as ImageInput['category'] }
                                : m,
                            ),
                          )
                        }
                      >
                        {Object.entries(mediaCategories).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="media-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Choisir comme image principale"
                        title="Image principale"
                        aria-pressed={item.isPrimary}
                        onClick={() =>
                          update(
                            items.map((m) => ({ ...m, isPrimary: m.mediaId === item.mediaId })),
                          )
                        }
                      >
                        <Star size={16} fill={item.isPrimary ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Avancer l’image"
                        disabled={index === 0}
                        onClick={() => move(item.mediaId, images[index - 1].mediaId)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Reculer l’image"
                        disabled={index === images.length - 1}
                        onClick={() => move(item.mediaId, images[index + 1].mediaId)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Retirer l’image"
                        onClick={() => remove(item.mediaId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.isPrimary && <small className="primary-caption">Image principale</small>}
                  </article>
                ))}
              </div>
              {!images.length && (
                <p className="field-hint">
                  Choisissez cette catégorie dans la zone d’ajout ci-dessus.
                </p>
              )}
            </details>
          )
        })}
        <LinkFields data={data} change={change} />
      </fieldset>
      {busy && (
        <p className="success-note" role="status">
          <LoaderCircle size={16} className="spin" /> Import en cours…
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="field-hint">
        Les retraits d’images existantes seront appliqués à l’enregistrement. Seules les copies
        locales inutilisées seront supprimées.
      </p>
    </section>
  )
}
