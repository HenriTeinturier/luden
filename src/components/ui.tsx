import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { X, ArrowUpRight, Plus, Gamepad2, Monitor, Disc3, Cloud, Clock3 } from 'lucide-react'
import { Link, useLoaderData, useParams, useLocation } from '@tanstack/react-router'
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Game, Platform } from '../lib/types'
import { playStatuses } from '../lib/platforms'
import { platformReleases } from '../lib/platform-releases'
import { Stars } from './rating'
import { coverFormat, platformPresentation } from '../lib/presentation'
import { gallerySearch } from '../lib/gallery'
import { mediaImageSources } from '../lib/image-variants'
import { useGameSelection } from './game-selection'

export function useLibrary() {
  const { library } = useLoaderData({ from: '__root__' })
  if (!library) throw new Error('Bibliothèque indisponible')
  return library
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}
export function SectionHeading({
  title,
  to,
  label = 'Tout parcourir',
}: {
  title: string
  to?: '/library' | '/platforms' | '/collections'
  label?: string
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to && (
        <Link to={to} className="text-link">
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  )
}
export function PlatformArt({
  platform,
  className = '',
}: {
  platform: Pick<Platform, 'id' | 'color'>
  className?: string
}) {
  const computer = ['pc', 'amiga', 'amstrad', 'atari-st'].includes(platform.id)
  return (
    <div
      className={`platform-art ${computer ? 'computer' : ''} ${className}`}
      style={{ '--platform-color': platform.color } as CSSProperties}
      aria-hidden="true"
    >
      <div className="art-orbit" />
      <div className="art-orbit second" />
      {computer ? (
        <div className="computer-art">
          <div className="computer-screen">
            <span />
            <span />
            <span />
            <Monitor />
          </div>
          <div className="computer-foot" />
          <div className="keyboard-art" />
        </div>
      ) : (
        <div className={`controller-art ${platform.id.startsWith('switch') ? 'handheld' : ''}`}>
          <div className="dpad">+</div>
          <div className="controller-center">
            {platform.id.startsWith('switch') ? (
              <div className="mini-landscape" />
            ) : (
              <Gamepad2 size={25} />
            )}
          </div>
          <div className="controller-buttons">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="stick left" />
          <span className="stick right" />
        </div>
      )}
    </div>
  )
}
export function PlatformCard({ platform, count }: { platform: Platform; count: number }) {
  const release = platformReleases[platform.id]
  const illustrated = [
    'snes',
    'amiga',
    'amstrad',
    'atari-st',
    'megadrive',
    'ps1',
    'n64',
    'ps2',
    'gamecube',
    'xbox',
    'dreamcast',
  ].includes(platform.id)
  return (
    <Link
      to="/platforms/$platformId"
      params={{ platformId: platform.id }}
      className={`platform-card ${illustrated ? `platform-card-${platform.id}` : ''}`}
      style={{ '--platform-color': platform.color } as CSSProperties}
    >
      <div className="platform-card-top">
        {illustrated ? (
          <img className="platform-card-logo" src={`/platforms/${platform.id}/logo.webp`} alt="" />
        ) : (
          <span>{platform.family}</span>
        )}
        <ArrowUpRight size={18} />
      </div>
      {illustrated ? (
        <img
          className="platform-card-console"
          src={
            ['snes', 'megadrive', 'ps1', 'n64', 'ps2', 'gamecube', 'xbox', 'dreamcast'].includes(
              platform.id,
            )
              ? `/platforms/${platform.id}/console.webp`
              : `/platforms/${platform.id}/computer.webp`
          }
          alt=""
          loading="lazy"
        />
      ) : (
        <PlatformArt platform={platform} />
      )}
      <div className="platform-card-bottom">
        <h3>{platform.name}</h3>
        <span>
          {release && (
            <>
              <span title={`Sortie de la plateforme — ${release.region} : ${release.year}`}>
                {release.year}
              </span>
              {' · '}
            </>
          )}
          {count} jeu{count !== 1 ? 'x' : ''}
        </span>
      </div>
    </Link>
  )
}
export function Cover({
  game,
  className = '',
  original = false,
  sizes = 'auto, (max-width: 700px) 45vw, 320px',
}: {
  game: Pick<Game, 'coverUrl' | 'title' | 'platform'> & { cover?: { width: number } | null }
  className?: string
  original?: boolean
  sizes?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <div
      className={`game-cover ${className}`}
      style={
        {
          '--platform-color': game.platform.color,
          '--cover-ratio': coverFormat(game.platform.id).ratio,
        } as CSSProperties
      }
    >
      {game.coverUrl && failedUrl !== game.coverUrl ? (
        <img
          {...(original
            ? { src: game.coverUrl }
            : mediaImageSources(game.coverUrl, game.cover?.width, sizes))}
          alt={`Jaquette de ${game.title}`}
          loading="lazy"
          onError={() => setFailedUrl(game.coverUrl)}
        />
      ) : (
        <div className="cover-placeholder">
          <span>{game.platform.shortName}</span>
          <Gamepad2 size={40} strokeWidth={1} />
          <strong>{game.title}</strong>
          <small>Votre prochaine image</small>
        </div>
      )}
    </div>
  )
}
export function GameCard({
  game,
  compact = false,
  sequence,
}: {
  game: Game
  compact?: boolean
  sequence?: string[]
}) {
  const selection = useGameSelection()
  const rating = game.experience?.rating
  const { platformId, collectionId } = useParams({ strict: false })
  const location = useLocation()
  const simpleCard = ['/library', '/discover'].includes(location.pathname.replace(/\/$/, ''))
  const platformLogo =
    simpleCard &&
    [
      'amiga',
      'amstrad',
      'snes',
      'atari-st',
      'megadrive',
      'ps1',
      'n64',
      'ps2',
      'gamecube',
      'xbox',
      'dreamcast',
    ].includes(game.platformId)
      ? `/platforms/${game.platformId}/logo.webp`
      : undefined
  return (
    <Link
      to="/games/$gameId"
      data-game-id={game.id}
      aria-current={selection?.selectedId === game.id ? 'true' : undefined}
      onClick={(event) => {
        if (
          !selection ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return
        event.preventDefault()
        selection.open(game.id, sequence ?? [game.id], event.currentTarget)
      }}
      params={{ gameId: game.id }}
      search={{
        from: platformId
          ? 'platform'
          : collectionId
            ? 'collection'
            : location.pathname === '/discover'
              ? 'discover'
              : 'library',
        fromId: platformId ?? collectionId,
        filters: gallerySearch.parse(location.search),
      }}
      className={`game-card ${compact ? 'compact' : ''} ${coverFormat(game.platformId).wide ? 'wide-cover' : ''}`}
    >
      <div className="cover-frame">
        <Cover game={game} />
        {game.favorite && (
          <span className="favorite-badge">
            <img src="/megastar.webp" alt="Megastar — Jeu culte" width={400} height={394} />
          </span>
        )}
      </div>
      <div className="game-card-info">
        <span className="game-platform">
          <span className="game-platform-name" title={game.platform.name}>
            {platformLogo ? (
              <img className="game-platform-logo" src={platformLogo} alt={game.platform.name} />
            ) : (
              <>
                {!simpleCard && (
                  <i style={{ background: game.platform.color }} aria-hidden="true" />
                )}
                <span>{game.platform.shortName}</span>
              </>
            )}
          </span>
          {game.releaseYear ? <span className="game-platform-year">{game.releaseYear}</span> : null}
        </span>
        <h3 title={game.title}>{game.title}</h3>
        {!simpleCard && (
          <>
            <Stars
              value={rating}
              showEmpty={platformPresentation(platformId ?? '').gallery.showEmptyStars}
            />
            <div className="game-card-bottom">
              <span>{playStatuses[game.experience?.status ?? 'UNPLAYED']}</span>
              <span className="possession-icons">
                {game.possessions.some((p) => p.format === 'PHYSICAL') && (
                  <Disc3 size={14} aria-label="Exemplaire physique" />
                )}
                {game.possessions.some((p) => p.format === 'DIGITAL') && (
                  <Cloud size={14} aria-label="Version digitale" />
                )}
                {game.possessions.some((p) => p.state === 'PAST') && (
                  <Clock3 size={14} aria-label="Possession ancienne" />
                )}
              </span>
            </div>
            {game.experience?.memory && <p className="card-memory">{game.experience.memory}</p>}
          </>
        )}
      </div>
    </Link>
  )
}
export function EmptyState({
  title = 'Tout commence par un jeu.',
  description = 'Un souvenir d’enfance, votre dernière aventure ou un jeu qui vous intrigue. À vous d’écrire la première page.',
  add = true,
  children,
}: {
  title?: string
  description?: string
  add?: boolean
  children?: ReactNode
}) {
  const { platformId } = useParams({ strict: false })
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Gamepad2 size={30} strokeWidth={1.4} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {add && (
        <Link to="/games/new" search={{ platform: platformId }} className="button">
          <Plus size={17} />
          Ajouter mon premier jeu
        </Link>
      )}
      {children}
    </div>
  )
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <Dialog.Close className="icon-button dialog-close" aria-label="Fermer">
            <X size={20} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export function Confirm({
  title,
  description,
  onConfirm,
  children,
  confirmLabel = 'Supprimer',
}: {
  title: string
  description: string
  onConfirm: () => void
  children: ReactNode
  confirmLabel?: string
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel className="button secondary">Annuler</AlertDialog.Cancel>
            <AlertDialog.Action className="button danger" onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
