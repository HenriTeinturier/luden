import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PanelRightClose, ChevronLeft, ChevronRight, Pencil, Pause, Play } from 'lucide-react'
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
  platforms,
  visuals,
  onClose,
  hiding = false,
}: {
  platform: Platform
  platforms: Platform[]
  visuals: PlatformVisual[]
  onClose: () => void
  hiding?: boolean
}) {
  const platformIndex = platforms.findIndex((p) => p.id === platform.id)
  const previousPlatform = platforms[(platformIndex - 1 + platforms.length) % platforms.length]
  const nextPlatform = platforms[(platformIndex + 1) % platforms.length]
  const banners = activePlatformVisuals(visuals, 'BANNER')
  const posters = useMemo(() => activePlatformVisuals(visuals, 'POSTER'), [visuals])
  const [selected, setSelected] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const [paused, setPaused] = useState(false)
  const [transition, setTransition] = useState<{
    from: PlatformVisual
    direction: 'next' | 'previous'
  } | null>(null)
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
  const nextUrl = posters[(index + 1) % posters.length]?.url
  const previousUrl = posters[(index - 1 + posters.length) % posters.length]?.url
  const playing = platform.slideshowEnabled && posters.length > 1 && !paused && !hiding
  const move = useCallback(
    (delta: number) => {
      if (!current || posters.length < 2 || transition) return
      setTransition({ from: current, direction: delta > 0 ? 'next' : 'previous' })
      setSelected(posters[(index + delta + posters.length) % posters.length].id)
    },
    [current, posters, index, transition],
  )
  useEffect(() => {
    // Warm the neighboring images before either manual or automatic navigation.
    for (const url of new Set([nextUrl, previousUrl])) {
      if (url) {
        const image = new Image()
        image.src = url
      }
    }
  }, [nextUrl, previousUrl])
  useEffect(() => {
    if (!transition) return
    // Also release the transition if animationend is interrupted (e.g. a hidden tab).
    const timer = setTimeout(() => setTransition(null), 550)
    return () => clearTimeout(timer)
  }, [transition])
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
    if (!restored || !playing || transition) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      if (!document.hidden) timer = setTimeout(() => move(1), platform.slideshowSeconds * 1000)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [restored, playing, transition, move, platform.slideshowSeconds])
  const posterUrl = current?.url
  return (
    <aside
      id="universe-sidebar"
      tabIndex={-1}
      className={`game-sidebar universe-sidebar ${hiding ? 'is-hiding' : ''}`}
      inert={hiding}
      aria-label={`Accueil de l’univers ${platform.name}`}
    >
      {platforms.length > 1 && platformIndex >= 0 && (
        <nav className="universe-platform-navigation" aria-label="Changer d’univers">
          <Link
            className="icon-button"
            to="/platforms/$platformId"
            params={{ platformId: previousPlatform.id }}
            search={{}}
            aria-label={`Univers précédent : ${previousPlatform.name}`}
            title={`Univers précédent : ${previousPlatform.name} · Alt + ←`}
            aria-keyshortcuts="Alt+ArrowLeft"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <Link
            className="icon-button"
            to="/platforms/$platformId"
            params={{ platformId: nextPlatform.id }}
            search={{}}
            aria-label={`Univers suivant : ${nextPlatform.name}`}
            title={`Univers suivant : ${nextPlatform.name} · Alt + →`}
            aria-keyshortcuts="Alt+ArrowRight"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </nav>
      )}
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
          <div
            className={`universe-poster-images ${transition ? `slide-${transition.direction}` : ''}`}
          >
            {transition && (
              <img
                key={`out-${transition.from.id}`}
                className="universe-sidebar-image is-leaving"
                src={transition.from.url}
                alt=""
                aria-hidden="true"
              />
            )}
            <img
              key={currentId}
              className={`universe-sidebar-image ${transition ? 'is-entering' : ''}`}
              src={posterUrl}
              alt={current?.caption || `Ambiance de l’univers ${platform.name}`}
              onAnimationEnd={() => setTransition(null)}
            />
          </div>
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
          aria-label="Modifier la présentation de la plateforme"
          title="Modifier la présentation de la plateforme"
        >
          <Pencil size={16} />
        </Link>
      </div>
      <button
        type="button"
        className="icon-button universe-sidebar-close"
        aria-label="Masquer la sidebar de l’univers"
        title="Masquer la sidebar · Échap"
        onClick={onClose}
      >
        <PanelRightClose size={20} />
      </button>
    </aside>
  )
}
