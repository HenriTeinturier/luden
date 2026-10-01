import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { X, ChevronLeft, ChevronRight, Pencil, Pause, Play } from 'lucide-react'
import type { Platform } from '../lib/types'
import {
  activePlatformVisuals,
  platformPosterStorageKey,
  restorePlatformPoster,
  type PlatformVisual,
} from '../lib/platform-visuals'
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
  const posters = useMemo(() => activePlatformVisuals(visuals, 'POSTER'), [visuals])
  const [selected, setSelected] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (restored) return
    try {
      setSelected(restorePlatformPoster(window.localStorage, platform.id, posters))
    } catch {
      /* Keep the default when access to localStorage is blocked. */
    }
    setRestored(true)
  }, [platform.id, posters, restored])
  const index = Math.max(
    0,
    posters.findIndex((v) => v.id === selected),
  )
  const current = posters[index]
  const currentId = current?.id
  const nextId = posters[(index + 1) % posters.length]?.id
  const playing = platform.slideshowEnabled && posters.length > 1 && !paused
  useEffect(() => {
    if (!restored) return
    try {
      if (currentId) window.localStorage.setItem(platformPosterStorageKey(platform.id), currentId)
      else window.localStorage.removeItem(platformPosterStorageKey(platform.id))
    } catch {
      /* Navigation remains available without storage. */
    }
  }, [currentId, platform.id, restored])
  useEffect(() => {
    if (!restored || !playing || !nextId) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      if (!document.hidden)
        timer = setTimeout(() => setSelected(nextId), platform.slideshowSeconds * 1000)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [restored, playing, nextId, currentId, platform.slideshowSeconds])
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
            <span
              className="universe-gallery-count"
              aria-live={playing ? 'off' : 'polite'}
              aria-atomic="true"
            >
              {platform.slideshowEnabled && (
                <button
                  type="button"
                  className="universe-gallery-play"
                  aria-label={paused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              )}
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
