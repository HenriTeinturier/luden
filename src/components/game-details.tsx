import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  NotebookPen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Undo2,
  Pencil,
  Heart,
  Sparkles,
  Disc3,
  Cloud,
  Images,
  Trash2,
  Check,
  LoaderCircle,
  ShieldCheck,
  Gamepad2,
} from 'lucide-react'
import type { z } from 'zod'
import type { Game } from '../lib/types'
import type { quickGameSchema } from '../lib/validation'
import { readPresentation } from '../lib/game-visuals'
import { playStatuses } from '../lib/platforms'
import { hasPlayed } from '../lib/gallery'
import { coverFormat } from '../lib/presentation'
import { quickUpdateGameFn, deleteGameFn } from '../server/functions'
import { GameBackground } from './game-background'
import { Cover, Confirm, Modal, useLibrary } from './ui'
import { GameMedia } from './game-media'
import { Stars } from './rating'
import { MegastarTrophy } from './megastar-trophy'
import { useNotification } from './notifications'

export function useGameKeys({
  enabled,
  close,
  move,
  moveVertical = move,
  expand,
}: {
  enabled: boolean
  close: () => void
  move?: (delta: number) => void
  moveVertical?: (delta: number) => void
  expand?: () => void
}) {
  useEffect(() => {
    if (!enabled) return
    function handle(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')
      )
        return
      if (event.key === 'Enter' && expand) {
        // Keep native activation for focused controls and links.
        if (
          target instanceof HTMLElement &&
          target.closest('button, a, summary, [role="button"], [role="link"], [role="checkbox"]')
        )
          return
        event.preventDefault()
        expand()
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
      if (move && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault()
        move(event.key === 'ArrowLeft' ? -1 : 1)
      }
      if (moveVertical && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault()
        moveVertical(event.key === 'ArrowUp' ? -1 : 1)
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [enabled, close, move, moveVertical, expand])
}

export function GameNavigation({
  index,
  total,
  disabled,
  onMove,
  onClose,
  full = false,
  closeLabel,
}: {
  index: number
  total: number
  disabled: boolean
  onMove: (delta: number) => void
  onClose: () => void
  full?: boolean
  closeLabel?: string
}) {
  const returnLabel = closeLabel ?? (full ? 'Revenir à la sidebar' : 'Revenir à la collection')
  return (
    <nav className="game-navigation" aria-label="Parcourir les jeux">
      {full && (
        <button className="text-link game-return" disabled={disabled} onClick={onClose}>
          <ArrowLeft size={17} />
          Retour à l’aperçu
        </button>
      )}
      <div className="game-navigation-arrows">
        <button
          className="icon-button"
          aria-label="Jeu précédent"
          title="Jeu précédent (←)"
          disabled={disabled || index <= 0}
          onClick={() => onMove(-1)}
        >
          <ChevronLeft size={21} />
        </button>
        <span aria-live="polite" aria-atomic="true">
          {index + 1} <span>/ {total}</span>
        </span>
        <button
          className="icon-button"
          aria-label="Jeu suivant"
          title="Jeu suivant (→)"
          disabled={disabled || index < 0 || index >= total - 1}
          onClick={() => onMove(1)}
        >
          <ChevronRight size={21} />
        </button>
      </div>
      <button
        className="icon-button game-close"
        aria-label={returnLabel}
        title={`${returnLabel} · Échap`}
        disabled={disabled}
        onClick={onClose}
      >
        <Undo2 size={20} />
      </button>
    </nav>
  )
}

function GameScene({ game, compact }: { game: Game; compact: boolean }) {
  const visuals = readPresentation(game.presentation)
  const box = visuals.box ?? game.media.find((m) => m.category === 'BOX')?.mediaId ?? game.coverId
  const support = visuals.support ?? game.media.find((m) => m.category === 'MEDIA')?.mediaId
  const [failedLogo, setFailedLogo] = useState(false)
  return (
    <div
      className={`game-scene ${visuals.background ? 'has-background' : 'without-background'} ${coverFormat(game.platformId).wide ? 'scene-wide-box' : ''}`}
      data-platform={game.platformId}
    >
      {compact && visuals.background && (
        <GameBackground mediaId={visuals.background} crop={visuals.sidebarCrop} />
      )}
      {(compact || !visuals.background) && <div className="scene-shade" />}
      <div className="scene-identity">
        {!compact && (
          <span className="scene-platform">
            {game.platform.name}
            {game.releaseYear ? ` · ${game.releaseYear}` : ''}
          </span>
        )}
        {visuals.logo && !failedLogo ? (
          <img
            className="scene-logo"
            src={`/media/${visuals.logo}`}
            alt={game.title}
            onError={() => setFailedLogo(true)}
          />
        ) : compact ? (
          <span className="scene-wordmark" aria-hidden="true">
            {game.title}
          </span>
        ) : (
          <h1>{game.title}</h1>
        )}
        {!compact && (
          <>
            <div className="scene-genres">
              {game.genres.slice(0, 3).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
            <span className="scene-caption">Votre collection. Votre histoire.</span>
          </>
        )}
      </div>
      <div className={`scene-objects ${support && support !== box ? 'has-support' : ''}`}>
        <Cover game={{ ...game, coverUrl: box ? `/media/${box}` : null }} className="scene-box" />
        {support &&
          support !== box &&
          (compact ? (
            <span className="scene-support-stand">
              <img
                className="scene-support"
                src={`/media/${support}`}
                alt={`Support de ${game.title}`}
              />
            </span>
          ) : (
            <img
              className="scene-support"
              src={`/media/${support}`}
              alt={`Support de ${game.title}`}
            />
          ))}
      </div>
    </div>
  )
}

function QuickExperience({
  game,
  onBusyChange,
  compact = false,
}: {
  game: Game
  onBusyChange: (busy: boolean) => void
  compact?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function update(patch: Omit<z.infer<typeof quickGameSchema>, 'id'>) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    onBusyChange(true)
    setError('')
    setMessage('')
    try {
      const result = await quickUpdateGameFn({ data: { id: game.id, ...patch } })
      if (!result.ok) throw new Error(result.error)
      await router.invalidate({ sync: true })
      setMessage('Enregistré')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.')
    } finally {
      saving.current = false
      setBusy(false)
      onBusyChange(false)
    }
  }
  if (compact) {
    const owned = game.possessions.some((p) => p.state === 'CURRENT')
    const played = hasPlayed(game)
    return (
      <section className="sidebar-experience" aria-label="Mon expérience">
        <fieldset disabled={busy}>
          <div className="sidebar-rating">
            <Stars value={game.experience?.rating} />
            <button
              type="button"
              className={`sidebar-megastar ${game.favorite ? 'is-favorite' : ''}`}
              aria-label="Megastar — jeu culte, favori"
              aria-pressed={game.favorite}
              onClick={() => void update({ favorite: !game.favorite })}
            >
              <MegastarTrophy />
              <span>
                <strong>Megastar</strong>
                <small>Jeu culte</small>
              </span>
            </button>
            <label className="sidebar-rating-editor" title="Modifier ma note sur 5">
              <Star
                className="rating-editor-star"
                size={15}
                fill="currentColor"
                aria-hidden="true"
              />
              <select
                aria-label="Ma note sur 5"
                value={game.experience?.rating ?? ''}
                onChange={(e) =>
                  void update({ rating: e.target.value === '' ? null : Number(e.target.value) })
                }
              >
                <option value="" aria-label="Sans note">
                  —
                </option>
                {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
                  <option key={n} value={n}>
                    {n.toLocaleString('fr-FR')}
                  </option>
                ))}
              </select>
              <ChevronDown className="rating-editor-chevron" size={14} aria-hidden="true" />
            </label>
          </div>
          <div className="sidebar-facts" aria-label="Informations du jeu">
            {(game.publisher || game.developer) && (
              <span className="sidebar-publisher" title={game.publisher || game.developer}>
                {game.publisher || game.developer}
              </span>
            )}
            {game.releaseYear && <span className="sidebar-year">{game.releaseYear}</span>}
            {game.genres.map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>
          <div className="sidebar-collection-actions">
            <button
              type="button"
              className={`sidebar-collection ${owned ? 'is-owned' : ''}`}
              onClick={() => void update({ owned: !owned })}
              title={owned ? 'Ne plus marquer comme possédé' : 'Marquer comme possédé'}
              aria-label="Dans ma collection"
              aria-pressed={owned}
            >
              <ShieldCheck size={23} />
              <span>
                <strong>Dans ma collection</strong>
                <small>
                  {owned
                    ? 'Possédé actuellement'
                    : game.possessions.length
                      ? 'Possédé autrefois'
                      : 'Non possédé'}
                </small>
              </span>
              {owned && <Check size={16} className="sidebar-active-check" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="sidebar-played"
              aria-pressed={played}
              onClick={() => void update({ status: played ? 'UNPLAYED' : 'PLAYED' })}
            >
              <Gamepad2 size={23} />
              <strong>Joué</strong>
              {played && <Check size={16} className="sidebar-active-check" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="sidebar-discover"
              aria-pressed={game.discover}
              onClick={() => void update({ discover: !game.discover })}
            >
              <Sparkles size={23} />
              <strong>À découvrir</strong>
              {game.discover && (
                <Check size={16} className="sidebar-active-check" aria-hidden="true" />
              )}
            </button>
          </div>
        </fieldset>
        <span className="sr-only" role="status">
          {busy ? 'Enregistrement…' : message}
        </span>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    )
  }
  return (
    <section className="quick-experience">
      <div className="detail-section-heading">
        <h2>Mon expérience</h2>
        <span className="quick-save-state" role="status">
          {busy ? (
            <>
              <LoaderCircle size={12} className="spin" />
              Enregistrement…
            </>
          ) : message ? (
            <>
              <Check size={12} />
              {message}
            </>
          ) : (
            'Modification rapide'
          )}
        </span>
      </div>
      <fieldset disabled={busy}>
        <div className="quick-rating">
          <Stars value={game.experience?.rating} />
          <label>
            <span className="sr-only">Ma note sur 5</span>
            <select
              aria-label="Ma note sur 5"
              value={game.experience?.rating ?? ''}
              onChange={(e) =>
                void update({ rating: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              <option value="">Sans note</option>
              {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString('fr-FR')} / 5
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="quick-status">
          Mon parcours
          <select
            value={game.experience?.status ?? 'UNPLAYED'}
            onChange={(e) =>
              void update({ status: e.target.value as NonNullable<Game['experience']>['status'] })
            }
          >
            {Object.entries(playStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="quick-toggles">
          <button
            type="button"
            className={`quick-toggle ${game.favorite ? 'is-favorite' : ''}`}
            aria-pressed={game.favorite}
            onClick={() => void update({ favorite: !game.favorite })}
          >
            <Heart size={16} fill={game.favorite ? 'currentColor' : 'none'} />
            Coup de cœur
          </button>
          <button
            type="button"
            className={`quick-toggle ${game.discover ? 'is-discover' : ''}`}
            aria-pressed={game.discover}
            onClick={() => void update({ discover: !game.discover })}
          >
            <Sparkles size={16} />À découvrir / rejouer
          </button>
        </div>
        {game.discover && (
          <label className="quick-status">
            Mon envie
            <select
              value={game.desire ?? ''}
              onChange={(e) =>
                void update({ desire: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              <option value="">Non précisée</option>
              {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString('fr-FR')} / 5
                </option>
              ))}
            </select>
          </label>
        )}
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

function Screenshots({ game, compact }: { game: Game; compact: boolean }) {
  const images = game.media.filter((m) => m.category === 'SCREENSHOT')
  const [selected, setSelected] = useState<number | null>(null)
  const [overview, setOverview] = useState(false)
  const [active, setActive] = useState(0)
  const strip = useRef<HTMLDivElement>(null)
  function highlight(index: number) {
    setActive(index)
    const container = strip.current
    const target = container?.children[index] as HTMLElement | undefined
    if (container && target) {
      const bounds = container.getBoundingClientRect()
      const itemBounds = target.getBoundingClientRect()
      if (itemBounds.left < bounds.left || itemBounds.right > bounds.right) {
        container.scrollTo({
          left: container.scrollLeft + itemBounds.left - bounds.left - 5,
          behavior: 'instant',
        })
      }
    }
  }
  function openImage(index: number) {
    highlight(index)
    setSelected(index)
  }
  if (!images.length) return null
  const item = selected === null ? null : images[selected]
  return (
    <section className="detail-screenshots">
      <div className="detail-section-heading">
        <h2>
          <Images size={16} />
          Captures d’écran
        </h2>
        <div className="screenshot-heading-actions">
          <span>{images.length}</span>
          {compact && (
            <button type="button" className="text-link" onClick={() => setOverview(true)}>
              Voir tout <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="screenshot-carousel">
        <div ref={strip} className={`screenshot-strip ${compact ? 'is-compact' : ''}`}>
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              aria-label={`Agrandir la capture ${index + 1}`}
              aria-current={compact && active === index ? 'true' : undefined}
              onFocus={() => compact && highlight(index)}
              onClick={() => openImage(index)}
            >
              <img
                src={`/media/${image.mediaId}`}
                alt={image.caption || `Capture ${index + 1} de ${game.title}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {compact && images.length > 1 && (
          <>
            <button
              type="button"
              className="screenshot-arrow is-previous"
              aria-label="Capture précédente"
              disabled={active === 0}
              onClick={() => highlight(active - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="screenshot-arrow is-next"
              aria-label="Capture suivante"
              disabled={active >= images.length - 1}
              onClick={() => highlight(active + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      <Modal
        open={overview || item !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setOverview(false)
          }
        }}
        title={item ? item.caption || game.title : 'Captures d’écran'}
        description={
          item
            ? `Capture ${(selected ?? 0) + 1} sur ${images.length}`
            : `${game.title} · ${images.length} captures`
        }
      >
        {overview && !item && (
          <div className="screenshot-overview">
            {images.map((image, index) => (
              <button
                type="button"
                key={image.id}
                aria-label={`Agrandir la capture ${index + 1}`}
                onClick={() => openImage(index)}
              >
                <img
                  src={`/media/${image.mediaId}`}
                  alt={image.caption || `Capture ${index + 1} de ${game.title}`}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        {item && (
          <img
            className="media-lightbox"
            src={`/media/${item.mediaId}`}
            alt={item.caption || `Capture de ${game.title}`}
          />
        )}
        {item && (
          <div className="dialog-actions">
            {overview && (
              <button type="button" className="text-link" onClick={() => setSelected(null)}>
                Toutes les captures
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              disabled={selected === 0}
              onClick={() => openImage((selected ?? 0) - 1)}
            >
              Précédente
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={selected === images.length - 1}
              onClick={() => openImage((selected ?? 0) + 1)}
            >
              Suivante
            </button>
          </div>
        )}
      </Modal>
    </section>
  )
}

export function GameDetails({
  game,
  compact = false,
  onExpand,
  onEdit,
  onDeleted,
  onBusyChange,
}: {
  game: Game
  compact?: boolean
  onExpand?: () => void
  onEdit: () => void
  onDeleted: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const { collections, categories } = useLibrary()
  const router = useRouter()
  const notify = useNotification()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inCollections = collections.filter((c) => game.entries.some((e) => e.collectionId === c.id))
  const visuals = readPresentation(game.presentation)
  const [editingMemory, setEditingMemory] = useState(false)
  const [memoryDraft, setMemoryDraft] = useState('')
  const [memoryError, setMemoryError] = useState('')
  const memoryEditing = useRef(false)
  const memorySaving = useRef(false)
  const memoryTrigger = useRef<HTMLButtonElement>(null)
  const memoryInput = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (editingMemory) memoryInput.current?.focus({ preventScroll: true })
  }, [editingMemory])
  function busyChange(value: boolean) {
    setBusy(value)
    onBusyChange(value || memoryEditing.current)
  }
  function startMemoryEdit() {
    setMemoryDraft(game.experience?.memory ?? '')
    setMemoryError('')
    memoryEditing.current = true
    setEditingMemory(true)
    onBusyChange(true)
  }
  function closeMemoryEdit() {
    memoryEditing.current = false
    setEditingMemory(false)
    setMemoryError('')
    onBusyChange(busy)
    requestAnimationFrame(() => memoryTrigger.current?.focus({ preventScroll: true }))
  }
  async function saveMemory() {
    if (memorySaving.current || busy) return
    memorySaving.current = true
    busyChange(true)
    setMemoryError('')
    try {
      const result = await quickUpdateGameFn({ data: { id: game.id, memory: memoryDraft } })
      if (!result.ok) throw new Error(result.error)
      await router.invalidate({ sync: true })
      closeMemoryEdit()
      notify('Souvenir enregistré')
    } catch (err) {
      setMemoryError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.')
    } finally {
      memorySaving.current = false
      busyChange(false)
    }
  }
  return (
    <article
      className={`game-dossier ${compact ? 'dossier-compact' : 'dossier-full'} ${!compact && visuals.background ? 'has-dossier-background' : ''} dossier-${game.platformId}`}
      style={{ '--game-accent': game.platform.color } as CSSProperties}
    >
      {!compact && visuals.background && (
        <div className="dossier-backdrop" aria-hidden="true">
          <img src={`/media/${visuals.background}`} alt="" />
        </div>
      )}
      <GameScene game={game} compact={compact} />
      <div className="dossier-body">
        <div className={compact ? 'sr-only' : 'dossier-heading'}>
          <div>
            {compact ? (
              <h2>{game.title}</h2>
            ) : visuals.logo ? (
              <h1 className="dossier-title">{game.title}</h1>
            ) : null}
            {!compact && (
              <div className="dossier-byline">
                {[game.developer, compact ? game.releaseYear : null, game.machine?.name]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>
          {!compact && (
            <button className="button secondary" disabled={busy} onClick={onEdit}>
              <Pencil size={15} />
              Modifier la fiche
            </button>
          )}
        </div>
        {compact && <QuickExperience game={game} onBusyChange={busyChange} compact />}
        <div className="dossier-personal">
          {!compact && <QuickExperience game={game} onBusyChange={busyChange} />}
          {
            <section className="dossier-memory">
              <div className="detail-section-heading">
                <h2>{compact && <NotebookPen size={16} />}Mes souvenirs</h2>
                <div className="memory-heading-actions">
                  {game.experience?.period && <span>{game.experience.period}</span>}
                  {compact && !editingMemory && (
                    <button
                      ref={memoryTrigger}
                      type="button"
                      className="text-link"
                      disabled={busy}
                      onClick={startMemoryEdit}
                    >
                      <Pencil size={14} />
                      {game.experience?.memory ? 'Modifier' : 'Écrire'}
                    </button>
                  )}
                </div>
              </div>
              {compact && editingMemory ? (
                <form
                  className="sidebar-memory-editor"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveMemory()
                  }}
                >
                  <label className="sr-only" htmlFor={`memory-${game.id}`}>
                    Mon souvenir
                  </label>
                  <textarea
                    id={`memory-${game.id}`}
                    ref={memoryInput}
                    value={memoryDraft}
                    onChange={(event) => setMemoryDraft(event.target.value)}
                    rows={4}
                    maxLength={20000}
                    disabled={busy}
                    placeholder="Une aventure, une époque, un souvenir à raconter…"
                  />
                  {memoryError && (
                    <p className="form-error" role="alert">
                      {memoryError}
                    </p>
                  )}
                  <div className="memory-editor-actions">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={closeMemoryEdit}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="button" disabled={busy}>
                      {busy ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />}
                      {busy ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : game.experience?.memory ? (
                <p className={compact ? 'memory-excerpt' : 'full-memory'}>
                  {game.experience.memory}
                </p>
              ) : (
                <p className="memory-empty">Une aventure, une époque, un souvenir à raconter.</p>
              )}
              {!compact && (
                <button className="text-link" disabled={busy} onClick={onEdit}>
                  <Pencil size={13} />
                  {game.experience?.memory ? 'Préciser mon souvenir' : 'Écrire mon souvenir'}
                </button>
              )}
            </section>
          }
        </div>
        <Screenshots game={game} compact={compact} />
        {compact ? (
          <div className="dossier-actions">
            <button
              className="button"
              disabled={busy || editingMemory}
              onClick={onExpand}
              title="Voir la fiche complète · Entrée"
              aria-keyshortcuts="Enter"
            >
              Voir la fiche complète
              <ArrowUpRight size={17} />
            </button>
            <button
              className="button secondary"
              disabled={busy || editingMemory}
              onClick={onEdit}
              title="Modifier la fiche"
            >
              <Pencil size={16} />
              <span>Modifier</span>
            </button>
          </div>
        ) : (
          <>
            <div className="dossier-information">
              <section className="dossier-info-card">
                <span className="eyebrow">LE JEU</span>
                <h2>À propos</h2>
                {game.summary ? (
                  <p>{game.summary}</p>
                ) : (
                  <p className="muted">Le résumé de cette version n’a pas encore été renseigné.</p>
                )}
                <dl className="dossier-facts">
                  {[
                    ['Plateforme', game.platform.name],
                    ['Sortie', game.releaseYear],
                    ['Développeur', game.developer],
                    ['Éditeur', game.publisher],
                    ['Genres', game.genres.join(', ')],
                    ['Rangement', categories.find((c) => c.id === game.categoryId)?.name],
                    ['PC personnel', game.machine?.name],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                </dl>
              </section>
              <section className="dossier-info-card">
                <span className="eyebrow">DANS MON HISTOIRE</span>
                <h2>Possessions & collections</h2>
                {game.possessions.length ? (
                  game.possessions.map((p) => (
                    <div className="dossier-possession" key={p.id}>
                      {p.format === 'PHYSICAL' ? <Disc3 size={20} /> : <Cloud size={20} />}
                      <div>
                        <strong>
                          {p.format === 'PHYSICAL'
                            ? 'Exemplaire physique'
                            : p.store || 'Version digitale'}
                        </strong>
                        <small>
                          {p.state === 'CURRENT' ? 'Possédé actuellement' : 'Possédé autrefois'}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Aucune possession renseignée.</p>
                )}
                <div className="dossier-collections">
                  {inCollections.map((c) => (
                    <Link
                      key={c.id}
                      to="/collections/$collectionId"
                      params={{ collectionId: c.id }}
                      className="collection-detail"
                    >
                      <Sparkles size={16} />
                      <span>
                        {c.name}
                        <small>
                          {c.kind === 'DREAM' ? 'Collection rêvée' : 'Collection réelle'}
                        </small>
                      </span>
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
                <button className="text-link" disabled={busy} onClick={onEdit}>
                  Modifier mes possessions et collections
                  <ArrowUpRight size={14} />
                </button>
              </section>
            </div>
            <GameMedia game={game} hideScreenshots />
            <div className="detail-danger">
              <Confirm
                title={`Supprimer « ${game.title} » ?`}
                confirmLabel="Oui, supprimer ce jeu"
                description="La fiche, son expérience et ses associations aux collections seront supprimées. Les images locales inutilisées seront également supprimées."
                onConfirm={() => {
                  void (async () => {
                    busyChange(true)
                    setError('')
                    try {
                      const result = await deleteGameFn({ data: game.id })
                      if (!result.ok) throw new Error(result.error)
                      await router.invalidate({ sync: true })
                      onDeleted()
                      notify('Le jeu a été supprimé de votre bibliothèque.')
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'La suppression a échoué.')
                    } finally {
                      busyChange(false)
                    }
                  })()
                }}
              >
                <button className="text-link danger-text" disabled={busy}>
                  <Trash2 size={14} />
                  Supprimer cette fiche
                </button>
              </Confirm>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </>
        )}
        <p className="dossier-keyboard">
          <kbd>←</kbd>
          <kbd>→</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd> parcourir les jeux <span>·</span>
          {compact && (
            <>
              <kbd>Entrée</kbd> fiche complète <span>·</span>
            </>
          )}
          <kbd>Échap</kbd> {compact ? 'fermer' : 'revenir à l’aperçu'}
        </p>
      </div>
    </article>
  )
}
