import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { Platform } from '../lib/types'
import { activePlatformVisuals, type PlatformVisual } from '../lib/platform-visuals'
import { PlatformArt } from './ui'

export function UniverseSidebar({
  platform,
  visuals,
  onClose,
}: {
  platform: Platform
  visuals: PlatformVisual[]
  onClose: () => void
}) {
  const banners = activePlatformVisuals(visuals, 'BANNER')
  const posters = activePlatformVisuals(visuals, 'POSTER')
  const [selected, setSelected] = useState<string | null>(null)
  const index = Math.max(
    0,
    posters.findIndex((v) => v.id === selected),
  )
  const current = posters[index]
  const posterUrl = current?.url
  const move = (delta: number) =>
    setSelected(posters[(index + delta + posters.length) % posters.length].id)
  return (
    <aside
      id="universe-sidebar"
      tabIndex={-1}
      className="game-sidebar universe-sidebar"
      aria-label={`Accueil de l’univers ${platform.name}`}
    >
      <div className="universe-banner">
        {banners[0] ? (
          <img
            src={banners[0].url}
            alt={banners[0].caption || platform.name}
            width={banners[0].width}
            height={banners[0].height}
          />
        ) : (
          <div className="universe-banner-fallback">
            {['snes', 'amiga', 'amstrad'].includes(platform.id) ? (
              <img src={`/platforms/${platform.id}/logo.webp`} alt={platform.name} />
            ) : (
              <h2>{platform.name}</h2>
            )}
          </div>
        )}
      </div>
      <div
        className="universe-poster"
        role="region"
        aria-label="Affiches de la plateforme"
        aria-roledescription="carrousel"
      >
        {posterUrl ? (
          <img
            className="universe-sidebar-image"
            src={posterUrl}
            alt={current?.caption || `Ambiance de l’univers ${platform.name}`}
          />
        ) : (
          <div className="universe-sidebar-fallback">
            <PlatformArt platform={platform} />
            <h2>{platform.name}</h2>
            <p>Vos jeux. Vos souvenirs.</p>
          </div>
        )}
        {posters.length > 1 && (
          <>
            <button
              type="button"
              className="universe-gallery-arrow previous"
              aria-label="Affiche précédente"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="universe-gallery-arrow next"
              aria-label="Affiche suivante"
              onClick={() => move(1)}
            >
              <ChevronRight size={22} />
            </button>
            <span className="universe-gallery-count" aria-live="polite" aria-atomic="true">
              {index + 1} / {posters.length}
            </span>
          </>
        )}
        <Link
          className="universe-edit"
          to="/platforms/$platformId/edit"
          params={{ platformId: platform.id }}
        >
          <Pencil size={15} /> Modifier
        </Link>
      </div>
      <button
        type="button"
        className="icon-button universe-sidebar-close"
        aria-label="Masquer la sidebar de l’univers"
        title="Masquer la sidebar · Échap"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </aside>
  )
}
