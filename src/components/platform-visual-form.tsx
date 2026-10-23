import { belongsToPlatform } from '../lib/wish-platforms'
import { useEffect, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ImagePlus, Check, Trash2 } from 'lucide-react'
import type { Platform } from '../lib/types'
import {
  platformVisualsSchema,
  withoutPlatformVisual,
  type PlatformVisual,
} from '../lib/platform-visuals'
import {
  savePlatformVisualsFn,
  deletePlatformVisualFn,
  deletePersonalPlatformFn,
} from '../server/functions'
import { useNotification } from './notifications'
import { Confirm, PlatformCard, useLibrary } from './ui'
import { UniverseSidebar } from './universe-sidebar'
import { PlatformEditorSettings, editorSections } from './platform-editor-settings'
import { PlatformPresetPreview } from './platform-preset-preview'
import { platformAssetKinds, type PlatformCustomization } from '../lib/platform-customization'
import { platformEditorSnapshot } from '../lib/platform-editor-state'
import { originalCardPlacement } from '../lib/platform-card-layout'
import { PlatformCreationReview } from './platform-creation-review'
import { useUnsavedChanges } from './use-unsaved-changes'
const creationSections = { ...editorSections, review: 'Récapitulatif' }
type CreationSection = keyof typeof creationSections
const assetLabels: Record<PlatformVisual['kind'], string> = {
  BANNER: 'Bandeaux',
  POSTER: 'Affiches',
  LOGO: 'Logo de la carte',
  BACKGROUND: 'Fond de la carte',
  HARDWARE: 'Console ou ordinateur',
  SIDEBAR_LOGO: 'Logo de la sidebar',
  SIDEBAR_BACKGROUND: 'Fond de la sidebar',
  SIDEBAR_HARDWARE: 'Machine de la sidebar',
}

export function PlatformVisualForm({
  platform,
  visuals,
}: {
  platform: Platform
  visuals: PlatformVisual[]
}) {
  const [items, setItems] = useState(visuals)
  const [section, setSection] = useState<CreationSection>(platform.isDraft ? 'card' : 'identity')
  const [catalogPlatformId, setCatalogPlatformId] = useState(platform.catalogPlatformId)
  const saving = useRef(false)
  const notify = useNotification()
  const [customization, setCustomization] = useState<PlatformCustomization>(platform.customization)
  const { games } = useLibrary()
  const draftPlatform = {
    ...platform,
    name: customization.title || platform.catalogName,
    shortName: customization.shortName || platform.catalogShortName,
    family: customization.family || platform.catalogFamily,
    categories: customization.categories ?? platform.categories,
    catalogPlatformId,
    customization,
  }
  const orderedItems = items.map((item, position) => ({ ...item, position }))
  const kinds: PlatformVisual['kind'][] =
    section === 'card'
      ? ['LOGO', 'BACKGROUND', 'HARDWARE']
      : section === 'sidebar'
        ? customization.sidebarMode === 'artwork'
          ? ['BANNER', 'POSTER']
          : ['SIDEBAR_LOGO', 'SIDEBAR_BACKGROUND', 'SIDEBAR_HARDWARE']
        : []
  function resetAsset(kind: PlatformCustomization['hiddenAssets'][number]) {
    setItems((previous) =>
      previous.map((v) => (v.kind === kind ? { ...v, active: false, isDefault: false } : v)),
    )
    setCustomization((previous) => ({
      ...previous,
      hiddenAssets: previous.hiddenAssets.filter((k) => k !== kind),
    }))
  }
  const [slideshowEnabled, setSlideshowEnabled] = useState(platform.slideshowEnabled)
  const [slideshowSeconds, setSlideshowSeconds] = useState(String(platform.slideshowSeconds))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const sections = platform.isDraft ? creationSections : editorSections
  const stepKeys = Object.keys(sections) as CreationSection[]
  const stepIndex = stepKeys.indexOf(section)
  const dirty =
    platformEditorSnapshot({
      customization,
      catalogPlatformId,
      slideshowEnabled,
      slideshowSeconds,
      visuals: items,
    }) !== platformEditorSnapshot({ ...platform, visuals })
  const { afterSave, leaveConfirmation } = useUnsavedChanges({
    dirty,
    busy,
    description:
      'Les réglages non enregistrés seront perdus. Les images déjà importées restent disponibles.' +
      (platform.isDraft ? ' Vous pourrez reprendre le dernier brouillon enregistré.' : ''),
  })
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function validate(publish: boolean) {
    const parsed = platformVisualsSchema.safeParse({
      platformId: platform.id,
      visuals: items,
      customization,
      ...(platform.ownerId ? { catalogPlatformId } : {}),
      ...(platform.isDraft ? { publish } : {}),
      slideshow: { enabled: slideshowEnabled, seconds: Number(slideshowSeconds) },
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setError(issue.message)
      if (issue.path[0] === 'slideshow') setSection('sidebar')
      else if (issue.path[0] === 'customization') {
        const field = issue.path[1]
        setSection(field === 'card' ? 'card' : field === 'sidebar' ? 'sidebar' : 'identity')
      }
    }
    return parsed
  }
  function changeSection(next: CreationSection) {
    if (next === 'review' && !validate(true).success) return
    setError('')
    setSection(next)
    requestAnimationFrame(() => panelRef.current?.focus())
  }
  async function removePlatform() {
    if (busy || saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    try {
      const result = await deletePersonalPlatformFn({ data: platform.id })
      if (!result.ok) throw new Error(result.error)
      await afterSave(async () => {
        await router.invalidate({ sync: true })
        await router.navigate({ to: '/platforms' })
      })
      notify(result.data.warning ?? 'La plateforme personnelle a été supprimée.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  async function save(publish: boolean) {
    if (busy || saving.current) return
    setError('')
    setMessage('')
    const parsed = validate(publish)
    if (!parsed.success) return
    saving.current = true
    setBusy(true)
    try {
      const result = await savePlatformVisualsFn({ data: parsed.data })
      if (!result.ok) throw new Error(result.error)
      await afterSave(async () => {
        await router.invalidate({ sync: true })
        if (platform.isDraft && !publish) await router.navigate({ to: '/platforms' })
        else
          await router.navigate({
            to: '/platforms/$platformId',
            params: { platformId: platform.id },
          })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  async function remove(item: PlatformVisual) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await deletePlatformVisualFn({
        data: { platformId: platform.id, id: item.id },
      })
      if (!result.ok) throw new Error(result.error)
      setItems((previous) => withoutPlatformVisual(previous, item.id))
      setMessage(
        result.data.warning ?? 'Image supprimée. Vos autres modifications restent à enregistrer.',
      )
      await router.invalidate({ sync: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible. Réessayez.')
    } finally {
      setBusy(false)
    }
  }
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
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      for (const file of files) {
        if (
          kind !== 'BANNER' &&
          kind !== 'POSTER' &&
          !['image/png', 'image/webp'].includes(file.type)
        )
          throw new Error(`${file.name} : choisissez une image PNG ou WebP.`)
        if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} : 12 Mo maximum par image.`)
        const form = new FormData()
        form.set('image', file)
        form.set('platformId', platform.id)
        form.set('kind', kind)
        const response = await fetch('/api/media', { method: 'POST', body: form })
        const result = (await response.json()) as PlatformVisual & { error?: string }
        if (!response.ok || result.error) throw new Error(result.error || 'Import impossible.')
        const single = kind !== 'BANNER' && kind !== 'POSTER'
        setItems((previous) => [
          ...previous.map((v) => (single && v.kind === kind ? { ...v, isDefault: false } : v)),
          {
            ...result,
            active: true,
            isDefault: single || !previous.some((v) => v.kind === kind && v.active),
          },
        ])
        if (single)
          setCustomization((previous) => ({
            ...previous,
            hiddenAssets: previous.hiddenAssets.filter((k) => k !== kind),
          }))
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
      {platform.isDraft ? (
        <Link to="/platforms" className="text-link">
          <ArrowLeft size={16} /> Mes plateformes
        </Link>
      ) : (
        <Link
          to="/platforms/$platformId"
          params={{ platformId: platform.id }}
          className="text-link"
        >
          <ArrowLeft size={16} /> Retour à l’univers
        </Link>
      )}
      <h1>
        {platform.isDraft ? 'Finaliser' : 'Personnaliser'} {platform.name}
      </h1>
      <p className="muted">
        {platform.isDraft
          ? `Étape ${stepIndex + 1} sur ${stepKeys.length} · ${creationSections[section]}. Les images sont facultatives.`
          : 'Identité, carte, formats de jeux et visuels de la sidebar.'}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (platform.isDraft && section !== 'review') changeSection(stepKeys[stepIndex + 1])
          else void save(true)
        }}
      >
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="form-error">
            {error}
          </p>
        )}
        <fieldset disabled={busy} className="platform-visual-fields">
          <div
            className="filter-tabs platform-editor-tabs"
            aria-label="Sections de la personnalisation"
          >
            {Object.entries(sections).map(([key, label], index) => (
              <button
                key={key}
                type="button"
                aria-pressed={section === key}
                aria-current={platform.isDraft && section === key ? 'step' : undefined}
                className={section === key ? 'active' : ''}
                onClick={() => changeSection(key as CreationSection)}
              >
                {platform.isDraft ? `${index + 1}. ${label}` : label}
              </button>
            ))}
          </div>
          <div
            ref={panelRef}
            tabIndex={-1}
            aria-label={creationSections[section]}
            className="platform-editor-layout"
          >
            <div className="platform-editor-controls">
              {section === 'review' ? (
                <PlatformCreationReview
                  platform={{
                    ...draftPlatform,
                    slideshowEnabled,
                    slideshowSeconds: Number(slideshowSeconds),
                  }}
                  visuals={orderedItems}
                  onEdit={changeSection}
                />
              ) : (
                <PlatformEditorSettings
                  section={section}
                  platform={platform}
                  value={customization}
                  onChange={setCustomization}
                  catalogPlatformId={catalogPlatformId}
                  onCatalogChange={(id) => {
                    setCatalogPlatformId(id)
                    const categories = customization.categories ?? platform.categories
                    if (id === 'pc' && !categories.includes('COMPUTER'))
                      setCustomization((previous) => ({
                        ...previous,
                        categories: [...categories, 'COMPUTER'],
                      }))
                  }}
                />
              )}
              {section === 'card' && (
                <button
                  type="button"
                  className="text-link platform-reset-card"
                  onClick={() => {
                    setItems((previous) =>
                      previous.map((v) =>
                        ['LOGO', 'BACKGROUND', 'HARDWARE'].includes(v.kind)
                          ? { ...v, active: false, isDefault: false }
                          : v,
                      ),
                    )
                    setCustomization((previous) => ({
                      ...previous,
                      cardEnabled: false,
                      card: originalCardPlacement(platform.id),
                      hiddenAssets: previous.hiddenAssets.filter((k) => k.startsWith('SIDEBAR_')),
                    }))
                  }}
                >
                  Rétablir la carte d’origine
                </button>
              )}
              {kinds.map((kind) => {
                const group = items.filter((v) => v.kind === kind)
                const assetKind = platformAssetKinds.find((k) => k === kind)
                return (
                  <section className="platform-visual-section" key={kind}>
                    <div className="platform-visual-heading">
                      <h2>{assetLabels[kind]}</h2>
                      <span>
                        {group.length} image{group.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p>
                      {kind === 'BANNER'
                        ? 'Seul le bandeau par défaut est affiché. Il reste fixe et conserve ses proportions.'
                        : kind === 'POSTER'
                          ? 'La dernière affiche consultée est mémorisée sur cet appareil. Sinon, la galerie s’ouvre sur l’affiche par défaut. Seules les affiches actives défilent.'
                          : 'L’image active par défaut est affichée. Les autres restent disponibles pour un prochain choix.'}
                    </p>
                    {assetKind && (
                      <div className="platform-mode-options">
                        <label>
                          <input
                            type="checkbox"
                            checked={customization.hiddenAssets.includes(assetKind)}
                            onChange={(event) =>
                              setCustomization((previous) => ({
                                ...previous,
                                hiddenAssets: event.target.checked
                                  ? [
                                      ...previous.hiddenAssets.filter((k) => k !== assetKind),
                                      assetKind,
                                    ]
                                  : previous.hiddenAssets.filter((k) => k !== assetKind),
                              }))
                            }
                          />
                          Masquer ce visuel
                        </label>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => resetAsset(assetKind)}
                        >
                          {kind.startsWith('SIDEBAR_')
                            ? 'Reprendre l’image de la carte'
                            : 'Reprendre le visuel d’origine'}
                        </button>
                      </div>
                    )}
                    {!group.length && (
                      <p className="field-hint">
                        Aucune image importée. Le visuel d’origine est utilisé s’il existe.
                      </p>
                    )}
                    <div
                      className={`platform-visual-grid ${kind === 'BANNER' ? 'is-banners' : ''}`}
                    >
                      {group.map((item, index) => (
                        <article
                          className={`platform-visual-item ${item.active ? '' : 'is-inactive'}`}
                          key={item.id}
                        >
                          <img
                            src={item.url}
                            alt={item.caption || `${assetLabels[kind]} ${index + 1}`}
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
                            <Confirm
                              title="Supprimer cette image ?"
                              description="L’image sera immédiatement supprimée de cette plateforme et du stockage Luden. Si elle est celle par défaut, la première image active restante la remplacera. Le fichier source importé reste intact."
                              confirmLabel="Supprimer l’image"
                              onConfirm={() => void remove(item)}
                            >
                              <button
                                type="button"
                                className="text-link danger-text platform-visual-delete"
                                disabled={busy}
                              >
                                <Trash2 size={15} /> Supprimer
                              </button>
                            </Confirm>
                          </div>
                        </article>
                      ))}
                    </div>
                    <label className="platform-upload">
                      <ImagePlus size={19} />
                      <span>Importer une image</span>
                      <input
                        type="file"
                        multiple={!assetKind}
                        accept={
                          assetKind
                            ? 'image/png,image/webp'
                            : 'image/jpeg,image/png,image/webp,image/avif,image/gif'
                        }
                        aria-label={`Importer : ${assetLabels[kind]}`}
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
              {section === 'sidebar' && customization.sidebarMode === 'artwork' && (
                <section className="platform-visual-section">
                  <div className="platform-visual-heading">
                    <h2>Défilement des affiches</h2>
                  </div>
                  <div className="platform-slideshow-settings">
                    <label>
                      <input
                        type="checkbox"
                        checked={slideshowEnabled}
                        onChange={(event) => setSlideshowEnabled(event.target.checked)}
                      />
                      Défilement automatique
                    </label>
                    <label>
                      Durée par image (secondes)
                      <input
                        type="number"
                        min={3}
                        max={120}
                        step={1}
                        required
                        value={slideshowSeconds}
                        onChange={(event) => setSlideshowSeconds(event.target.value)}
                      />
                    </label>
                  </div>
                  <p>
                    De 3 à 120 secondes. Le défilement commence avec au moins deux affiches actives.
                    Le bandeau reste fixe.
                  </p>
                </section>
              )}
            </div>
            <aside className="platform-editor-preview" aria-label="Aperçu de la présentation">
              <h2>Aperçu</h2>
              {section === 'games' ? (
                <PlatformPresetPreview platform={draftPlatform} />
              ) : section === 'sidebar' ? (
                <UniverseSidebar
                  key={customization.sidebarMode}
                  platform={{
                    ...draftPlatform,
                    slideshowEnabled,
                    slideshowSeconds: Number(slideshowSeconds),
                  }}
                  platforms={[]}
                  visuals={orderedItems}
                  onClose={() => {}}
                  preview
                />
              ) : (
                <div className="platforms-index">
                  <PlatformCard
                    platform={draftPlatform}
                    count={games.filter((g) => belongsToPlatform(g, platform.id)).length}
                    visuals={orderedItems}
                    preview
                  />
                </div>
              )}
            </aside>
          </div>
          <p className="field-hint">
            JPG, PNG, WebP, AVIF ou GIF · 12 Mo par image. Les imports sont conservés immédiatement.
            Enregistrez pour appliquer l’activation, l’ordre et les images par défaut. Désactiver
            une image ne la supprime pas.
          </p>
          <div className="platform-save-actions">
            {platform.isDraft && stepIndex > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => changeSection(stepKeys[stepIndex - 1])}
              >
                <ArrowLeft size={17} /> Précédent
              </button>
            )}
            <button type="submit" className="button">
              {platform.isDraft && section !== 'review' ? (
                <ArrowRight size={17} />
              ) : (
                <Check size={17} />
              )}
              {busy
                ? 'En cours…'
                : platform.isDraft
                  ? section === 'review'
                    ? 'Créer la plateforme'
                    : `Suivant : ${creationSections[stepKeys[stepIndex + 1]]}`
                  : 'Enregistrer la présentation'}
            </button>
            {platform.isDraft && (
              <button type="button" className="button secondary" onClick={() => void save(false)}>
                Enregistrer le brouillon
              </button>
            )}
          </div>
        </fieldset>
        {platform.ownerId && (
          <div className="platform-delete-action">
            <Confirm
              title={`Supprimer ${platform.name} ?`}
              description="Cette plateforme personnelle et ses visuels seront supprimés. La suppression est possible uniquement si elle ne contient aucun jeu. Les fichiers source importés sont conservés."
              confirmLabel="Supprimer la plateforme"
              onConfirm={() => void removePlatform()}
            >
              <button type="button" disabled={busy} className="text-link danger-text">
                <Trash2 size={16} />
                {platform.isDraft ? 'Supprimer ce brouillon' : 'Supprimer cette plateforme'}
              </button>
            </Confirm>
          </div>
        )}
        {message && <p role="status">{message}</p>}
      </form>
      {leaveConfirmation}
    </div>
  )
}
