import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  NotebookPen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Undo2,
  Pencil,
  Heart,
  Sparkles,
  Bookmark,
  Disc3,
  Cloud,
  Images,
  Trash2,
  Check,
  LoaderCircle,
  ShieldCheck,
  Gamepad2,
  Pause,
  Play,
} from 'lucide-react'
import type { z } from 'zod'
import type { Game } from '../lib/types'
import type { quickGameSchema } from '../lib/validation'
import { readPresentation } from '../lib/game-visuals'
import { mediaCategories } from '../lib/media'
import { mediaImageSources } from '../lib/image-variants'
import { playStatuses } from '../lib/platforms'
import { hasPlayed } from '../lib/gallery'
import { sidebarRatingKind } from '../lib/sidebar-rating'
import { quickUpdateGameFn, deleteGameFn } from '../server/functions'
import { GameScene } from './game-scene'
import { Confirm, Modal, useLibrary } from './ui'
import { GameMedia } from './game-media'
import { EditableStars, Stars } from './rating'
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
          disabled={disabled || index < 0 || total <= 1}
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
          disabled={disabled || index < 0 || total <= 1}
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

function QuickExperience({
  game,
  onBusyChange,
  compact = false,
  onEdit,
  disabled = false,
  children,
}: {
  game: Game
  onBusyChange: (busy: boolean) => void
  compact?: boolean
  onEdit?: () => void
  disabled?: boolean
  children?: ReactNode
}) {
  const router = useRouter()
  const { collections } = useLibrary()
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [proposedRating, setProposedRating] = useState<number | null | undefined>(undefined)
  const [proposedFavorite, setProposedFavorite] = useState<boolean | undefined>(undefined)
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
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.')
      return false
    } finally {
      saving.current = false
      setBusy(false)
      onBusyChange(false)
    }
  }
  if (compact) {
    const owned = game.possessions.some((p) => p.state === 'CURRENT')
    const played = hasPlayed(game)
    const ratingKind = sidebarRatingKind(game)
    const physical = game.possessions.some((p) => p.state === 'CURRENT' && p.format === 'PHYSICAL')
    const digital = game.possessions.some((p) => p.state === 'CURRENT' && p.format === 'DIGITAL')
    const possessionLabel = owned
      ? `Possédé · ${physical && digital ? 'physique et numérique' : physical ? 'physique' : 'numérique'}`
      : game.possessions.length
        ? 'Possédé autrefois'
        : 'Non possédé'
    const inCollections = collections.filter((c) =>
      game.entries.some((e) => e.collectionId === c.id),
    )
    return (
      <section className="sidebar-experience" aria-label="Mon expérience">
        <fieldset disabled={busy || disabled}>
          <div className="sidebar-rating">
            {ratingKind === 'rating' ? (
              <EditableStars
                key="rating"
                value={game.experience?.rating ?? null}
                disabled={busy || disabled}
                onChange={setProposedRating}
              />
            ) : ratingKind === 'desire' ? (
              <EditableStars
                key="desire"
                kind="desire"
                label="Envie de jouer"
                value={game.desire}
                disabled={busy || disabled}
                onChange={(desire) => void update({ desire })}
              />
            ) : (
              <span className="sidebar-souvenir-caption">
                <Bookmark size={16} aria-hidden="true" /> Souvenir
              </span>
            )}
            <button
              type="button"
              className={`sidebar-megastar ${game.favorite ? 'is-favorite' : ''}`}
              aria-label="Megastar — jeu culte, favori"
              aria-pressed={game.favorite}
              onClick={() => {
                setError('')
                setProposedFavorite(!game.favorite)
              }}
            >
              <MegastarTrophy />
              <span>
                <strong>Megastar</strong>
                <small>Jeu culte</small>
              </span>
            </button>
            <button
              type="button"
              className="sidebar-edit icon-button"
              onClick={onEdit}
              title="Modifier la fiche"
              aria-label="Modifier la fiche"
            >
              <Pencil size={17} />
            </button>
          </div>
        </fieldset>
        {children}
        <fieldset disabled={busy || disabled} className="sidebar-details">
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
              className="sidebar-played"
              aria-pressed={played}
              title={played ? 'Marquer comme non joué' : 'Marquer comme joué'}
              onClick={() => void update({ status: played ? 'UNPLAYED' : 'PLAYED' })}
            >
              <Gamepad2 size={16} />
              <span>{played ? 'Joué' : 'Non joué'}</span>
              {played && <Check size={12} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className={`sidebar-collection ${owned ? 'is-owned' : ''}`}
              onClick={() => void update({ owned: !owned })}
              title={owned ? 'Ne plus marquer comme possédé' : 'Marquer comme possédé'}
              aria-label={possessionLabel}
              aria-pressed={owned}
            >
              <ShieldCheck size={16} />
              <span>{possessionLabel}</span>
              {owned && <Check size={12} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="sidebar-discover"
              aria-pressed={game.discover}
              title={game.discover ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
              onClick={() => void update({ discover: !game.discover })}
            >
              <Sparkles size={16} />
              <span>{game.discover ? 'Dans mes envies' : 'Ajouter à mes envies'}</span>
              {game.discover && <Check size={12} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="sidebar-discover"
              aria-pressed={game.souvenir}
              title="Garder ce jeu en souvenir, indépendamment des envies et de la possession"
              onClick={() => void update({ souvenir: !game.souvenir })}
            >
              <Bookmark size={16} fill={game.souvenir ? 'currentColor' : 'none'} />
              <span>Souvenir</span>
              {game.souvenir && <Check size={12} aria-hidden="true" />}
            </button>
            <div className="sidebar-memberships" aria-label="Mes collections">
              <Layers size={14} aria-hidden="true" />
              <span>Collections</span>
              {inCollections.map((collection) => (
                <button
                  type="button"
                  key={collection.id}
                  onClick={onEdit}
                  title={`Modifier mes collections · ${collection.name}`}
                >
                  {collection.name}{' '}
                  <small>{collection.kind === 'DREAM' ? 'rêvée' : 'réelle'}</small>
                </button>
              ))}
              {!inCollections.length && (
                <button type="button" onClick={onEdit}>
                  Ajouter à une collection
                </button>
              )}
            </div>
          </div>
        </fieldset>
        <Modal
          open={proposedRating !== undefined}
          onOpenChange={(open) => {
            if (!open && !busy) setProposedRating(undefined)
          }}
          title={proposedRating === null ? 'Effacer ma note ?' : 'Valider cette note ?'}
          description={`Note actuelle : ${game.experience?.rating == null ? 'sans note' : `${game.experience.rating.toLocaleString('fr-FR')} / 5`}. ${proposedRating == null ? 'Le jeu ne sera plus noté.' : `Nouvelle note : ${proposedRating.toLocaleString('fr-FR')} / 5.`}`}
        >
          <div className="rating-confirm-preview">
            <Stars value={proposedRating} />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setProposedRating(undefined)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="button sidebar-confirm"
              disabled={busy}
              onClick={() => {
                if (proposedRating !== undefined)
                  void update({ rating: proposedRating }).then((saved) => {
                    if (saved) setProposedRating(undefined)
                  })
              }}
            >
              {busy
                ? 'Enregistrement…'
                : proposedRating === null
                  ? 'Effacer la note'
                  : 'Valider la note'}
            </button>
          </div>
        </Modal>
        <Modal
          open={proposedFavorite !== undefined}
          onOpenChange={(open) => {
            if (!open && !busy) setProposedFavorite(undefined)
          }}
          title={proposedFavorite ? 'Ajouter à mes Megastar ?' : 'Retirer de mes Megastar ?'}
          description={
            proposedFavorite
              ? `${game.title} sera marqué comme jeu culte parmi vos favoris.`
              : `${game.title} ne sera plus marqué comme Megastar.`
          }
        >
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setProposedFavorite(undefined)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="button sidebar-confirm"
              disabled={busy}
              onClick={() => {
                if (proposedFavorite !== undefined)
                  void update({ favorite: proposedFavorite }).then((saved) => {
                    if (saved) setProposedFavorite(undefined)
                  })
              }}
            >
              {busy
                ? 'Enregistrement…'
                : proposedFavorite
                  ? 'Ajouter aux Megastar'
                  : 'Retirer des Megastar'}
            </button>
          </div>
        </Modal>
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
            <Sparkles size={16} />
            Dans mes envies
          </button>
        </div>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={game.souvenir}
            onChange={(e) => void update({ souvenir: e.target.checked })}
          />
          Souvenir
        </label>
        <p className="field-hint">
          Garder ce jeu en mémoire, même sans y avoir joué ni vouloir y jouer.
        </p>
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

function GameImageGallery({ game, compact }: { game: Game; compact: boolean }) {
  const screenshots = game.media.filter((m) => m.category === 'SCREENSHOT')
  const images = compact
    ? [...screenshots, ...game.media.filter((m) => m.category !== 'SCREENSHOT')]
    : screenshots
  const title = compact ? 'Galerie' : 'Captures d’écran'
  const imageLabel = (index: number) => (compact ? `Image ${index + 1}` : `Capture ${index + 1}`)
  const enlargeLabel = (index: number) =>
    compact ? `Agrandir l’image ${index + 1}` : `Agrandir la capture ${index + 1}`
  const [selected, setSelected] = useState<number | null>(null)
  const [overview, setOverview] = useState(false)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [looping, setLooping] = useState(false)
  const strip = useRef<HTMLDivElement>(null)
  const slideFrame = useRef<number | undefined>(undefined)
  const stopSlide = useCallback(() => {
    if (slideFrame.current !== undefined) cancelAnimationFrame(slideFrame.current)
    slideFrame.current = undefined
  }, [])
  const slideTo = useCallback(
    (left: number) => {
      stopSlide()
      const container = strip.current
      if (!container) return
      if (reducedMotion) {
        container.scrollTo({ left, behavior: 'instant' })
        return
      }
      const start = container.scrollLeft
      const started = performance.now()
      const frame = (now: number) => {
        const progress = Math.min(1, (now - started) / 750)
        // Gentle acceleration and deceleration, independent of browser smooth-scroll duration.
        const eased = (1 - Math.cos(Math.PI * progress)) / 2
        container.scrollTo({ left: start + (left - start) * eased, behavior: 'instant' })
        slideFrame.current = progress < 1 ? requestAnimationFrame(frame) : undefined
      }
      slideFrame.current = requestAnimationFrame(frame)
    },
    [reducedMotion, stopSlide],
  )
  useEffect(() => stopSlide, [compact, reducedMotion, stopSlide])
  useEffect(() => {
    const container = strip.current
    if (!compact || !container || images.length < 2) {
      setLooping(false)
      return
    }
    const measure = () => {
      const first = container.children[0] as HTMLElement
      const gap = parseFloat(getComputedStyle(container).columnGap) || 0
      const width = first.getBoundingClientRect().width
      setLooping(images.length * (width + gap) - gap > container.clientWidth - 6 + 1)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    measure()
    return () => observer.disconnect()
  }, [compact, images.length])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(preference.matches)
    sync()
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    if (
      !compact ||
      !looping ||
      images.length < 2 ||
      paused ||
      hovered ||
      focused ||
      reducedMotion ||
      overview ||
      selected !== null
    )
      return
    const timer = window.setInterval(() => {
      const container = strip.current
      if (
        !container ||
        document.hidden ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      )
        return
      const first = container.children[0] as HTMLElement
      const second = container.children[1] as HTMLElement
      const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left
      let position = Math.round(container.scrollLeft / step)
      if (position >= images.length) {
        // Rebase identical copies before starting the next slide, never during it.
        position %= images.length
        container.scrollTo({ left: position * step, behavior: 'instant' })
      }
      const next = position + 1
      setActive(next % images.length)
      slideTo(next * step)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [
    compact,
    looping,
    images.length,
    paused,
    hovered,
    focused,
    reducedMotion,
    overview,
    selected,
    slideTo,
  ])
  function highlight(index: number) {
    stopSlide()
    setActive(index % images.length)
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
    stopSlide()
    setSelected(index)
  }
  function moveImage(delta: number) {
    const container = strip.current
    if (!looping || !container) {
      highlight(Math.max(0, Math.min(images.length - 1, active + delta)))
      return
    }
    const first = container.children[0] as HTMLElement
    const second = container.children[1] as HTMLElement
    const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left
    let position = Math.round(container.scrollLeft / step)
    if (position >= images.length) {
      position %= images.length
      container.scrollTo({ left: position * step, behavior: 'instant' })
    }
    if (position === 0 && delta < 0) {
      position = images.length
      container.scrollTo({ left: position * step, behavior: 'instant' })
    }
    const next = position + delta
    setActive((next + images.length) % images.length)
    slideTo(next * step)
  }
  if (!images.length) return null
  const item = selected === null ? null : images[selected]
  return (
    <section
      className="detail-screenshots"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div className="detail-section-heading">
        <h2>
          <Images size={16} />
          {title}
        </h2>
        <div className="screenshot-heading-actions">
          <span>{images.length}</span>
          {compact && looping && !reducedMotion && (
            <button
              type="button"
              className="screenshot-autoplay"
              aria-label={
                paused ? 'Reprendre le défilement des images' : 'Mettre les images en pause'
              }
              title={paused ? 'Reprendre le défilement' : 'Pause · une image toutes les 2 secondes'}
              onClick={() => {
                setPaused(!paused)
                // Explicit playback can resume while this control keeps keyboard focus.
                if (paused) setFocused(false)
              }}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          {compact && (
            <button type="button" className="text-link" onClick={() => setOverview(true)}>
              Voir tout <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="screenshot-carousel">
        <div
          ref={strip}
          className={`screenshot-strip ${compact ? 'is-compact' : ''} ${looping ? 'is-looping' : ''}`}
          onPointerDown={stopSlide}
          onWheel={(event) => {
            if (event.deltaX || event.shiftKey) stopSlide()
          }}
        >
          {(looping ? [...images, ...images] : images).map((image, index) => (
            <button
              type="button"
              key={`${image.id}-${index}`}
              tabIndex={index >= images.length ? -1 : undefined}
              aria-label={enlargeLabel(index % images.length)}
              title={compact ? image.caption || mediaCategories[image.category] : undefined}
              aria-current={compact && active === index % images.length ? 'true' : undefined}
              onFocus={() => compact && highlight(index)}
              onClick={() => openImage(index % images.length)}
            >
              <img
                {...mediaImageSources(
                  `/media/${image.mediaId}`,
                  image.media.width,
                  'auto, (max-width: 800px) 40vw, 240px',
                )}
                alt={
                  image.caption ||
                  `${compact ? mediaCategories[image.category] : imageLabel(index % images.length)} · ${game.title}`
                }
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
              aria-label="Image précédente"
              disabled={!looping && active === 0}
              onClick={() => moveImage(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="screenshot-arrow is-next"
              aria-label="Image suivante"
              disabled={!looping && active >= images.length - 1}
              onClick={() => moveImage(1)}
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
        title={item ? item.caption || game.title : title}
        description={
          item
            ? `${imageLabel(selected ?? 0)} sur ${images.length}${compact ? ` · ${mediaCategories[item.category]}` : ''}`
            : `${game.title} · ${images.length} ${compact ? 'images' : 'captures'}`
        }
      >
        {overview && !item && (
          <div className="screenshot-overview">
            {images.map((image, index) => (
              <button
                type="button"
                key={image.id}
                aria-label={enlargeLabel(index)}
                title={image.caption || mediaCategories[image.category]}
                onClick={() => openImage(index)}
              >
                <img
                  {...mediaImageSources(
                    `/media/${image.mediaId}`,
                    image.media.width,
                    'auto, (max-width: 800px) 40vw, 240px',
                  )}
                  alt={
                    image.caption ||
                    `${compact ? mediaCategories[image.category] : imageLabel(index)} · ${game.title}`
                  }
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
            alt={
              item.caption ||
              `${compact ? mediaCategories[item.category] : 'Capture'} · ${game.title}`
            }
          />
        )}
        {item && (
          <div className="dialog-actions">
            {overview && (
              <button type="button" className="text-link" onClick={() => setSelected(null)}>
                {compact ? 'Toutes les images' : 'Toutes les captures'}
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

function MemoryExcerpt({ memory }: { memory: string }) {
  const [expanded, setExpanded] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const paragraph = useRef<HTMLParagraphElement>(null)
  const more = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [hoverPosition, setHoverPosition] = useState<CSSProperties | null>(null)
  const hoverId = useId()
  function closeHover() {
    clearTimeout(hoverTimer.current)
    setHoverPosition(null)
  }
  function showHover() {
    clearTimeout(hoverTimer.current)
    if (expanded) return
    hoverTimer.current = setTimeout(() => {
      const bounds = more.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.min(560, window.innerWidth - 32)
      const bottom = Math.max(16, window.innerHeight - bounds.bottom)
      setHoverPosition({
        width,
        left: Math.max(16, Math.min(bounds.left - width - 12, window.innerWidth - width - 16)),
        bottom,
        maxHeight: Math.min(520, window.innerHeight - bottom - 16),
      })
    }, 350)
  }
  function leaveHover() {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoverPosition(null), 180)
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), [])
  useEffect(() => {
    if (!hoverPosition) return
    function dismiss(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      clearTimeout(hoverTimer.current)
      setHoverPosition(null)
    }
    const resize = () => setHoverPosition(null)
    document.addEventListener('keydown', dismiss, true)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('keydown', dismiss, true)
      window.removeEventListener('resize', resize)
    }
  }, [hoverPosition])
  useEffect(() => {
    const element = paragraph.current
    if (!element) return
    const measure = () => setTruncated(element.scrollHeight > element.clientHeight + 1)
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [memory])
  return (
    <>
      <div className="memory-preview">
        <p ref={paragraph} className="memory-excerpt">
          {memory}
        </p>
      </div>
      {truncated && (
        <button
          ref={more}
          type="button"
          className="text-link memory-read-more"
          aria-haspopup="dialog"
          aria-describedby={hoverPosition ? hoverId : undefined}
          onPointerEnter={(event) => {
            if (event.pointerType !== 'touch') showHover()
          }}
          onPointerLeave={leaveHover}
          onFocus={showHover}
          onBlur={closeHover}
          onClick={() => {
            closeHover()
            setExpanded(true)
          }}
        >
          Lire la suite
        </button>
      )}
      {hoverPosition &&
        !expanded &&
        createPortal(
          <div
            id={hoverId}
            role="tooltip"
            className="memory-hover-card"
            style={hoverPosition}
            onPointerEnter={() => clearTimeout(hoverTimer.current)}
            onPointerLeave={leaveHover}
          >
            <strong>Mes souvenirs</strong>
            <p className="memory-reader">{memory}</p>
          </div>,
          document.body,
        )}
      <Modal
        open={expanded}
        onOpenChange={setExpanded}
        title="Mes souvenirs"
        description="Le souvenir complet de ce jeu."
      >
        <p className="memory-reader">{memory}</p>
      </Modal>
    </>
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
  const memorySection = (
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
      {compact && (
        <Modal
          open={editingMemory}
          onOpenChange={(open) => {
            if (!open && !busy) closeMemoryEdit()
          }}
          title="Écrire mon souvenir"
          description={game.title}
        >
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
        </Modal>
      )}
      {game.experience?.memory ? (
        compact ? (
          <MemoryExcerpt memory={game.experience.memory} />
        ) : (
          <p className="full-memory">{game.experience.memory}</p>
        )
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
  )
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
      <GameScene
        game={game}
        compact={compact}
        onExpand={onExpand}
        disabled={busy || editingMemory}
      />
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
        {compact ? (
          <QuickExperience
            game={game}
            onBusyChange={busyChange}
            onEdit={onEdit}
            disabled={busy || editingMemory}
            compact
          >
            <div className="dossier-personal">{memorySection}</div>
          </QuickExperience>
        ) : (
          <div className="dossier-personal">
            <QuickExperience game={game} onBusyChange={busyChange} />
            {memorySection}
          </div>
        )}
        <GameImageGallery game={game} compact={compact} />
        {!compact && (
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
                      notify(
                        result.data.mediaWarning ?? 'Le jeu a été supprimé de votre bibliothèque.',
                      )
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
