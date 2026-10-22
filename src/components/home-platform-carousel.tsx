import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { PlatformCard, SectionHeading, useLibrary } from './ui'
import { useHomePlatforms } from './use-home-platforms'
import {
  homePlatformCapacity,
  homePlatformWindow,
  selectHomePlatforms,
} from '../lib/home-platforms'

export function HomePlatformCarousel() {
  const { platforms, games } = useLibrary()
  const { preference } = useHomePlatforms()
  const section = useRef<HTMLElement>(null)
  const [capacity, setCapacity] = useState(4)
  useEffect(() => {
    if (!section.current) return
    const observer = new ResizeObserver(([entry]) =>
      setCapacity(homePlatformCapacity(entry.contentRect.width)),
    )
    observer.observe(section.current)
    return () => observer.disconnect()
  }, [])
  const selected = selectHomePlatforms(platforms, games, preference)
  return (
    <section ref={section} className="home-universes" aria-label="Vos univers">
      <SectionHeading
        title="À chaque machine, son univers."
        to="/platforms"
        label="Toutes les plateformes"
      />
      {selected.length ? (
        <PlatformSlides
          key={`${capacity}:${selected.map((p) => p.id).join(',')}`}
          platforms={selected}
          games={games}
          capacity={capacity}
        />
      ) : (
        <p className="field-hint">
          Aucune plateforme affichée. <Link to="/settings">Choisir les plateformes à afficher</Link>
        </p>
      )}
    </section>
  )
}

function PlatformSlides({
  platforms,
  games,
  capacity,
}: {
  platforms: ReturnType<typeof useLibrary>['platforms']
  games: ReturnType<typeof useLibrary>['games']
  capacity: number
}) {
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [documentHidden, setDocumentHidden] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const pageCount = Math.ceil(platforms.length / capacity)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(query.matches)
    const updateVisibility = () => setDocumentHidden(document.hidden)
    updateMotion()
    updateVisibility()
    query.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      query.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  const auto = !paused && !reducedMotion
  useEffect(() => {
    if (pageCount < 2 || !auto || hovered || focused || documentHidden) return
    const timer = window.setInterval(() => setPage((current) => (current + 1) % pageCount), 6000)
    return () => window.clearInterval(timer)
  }, [pageCount, auto, hovered, focused, documentHidden])
  const shown = homePlatformWindow(platforms, capacity, page)
  return (
    <div
      className="home-platform-carousel"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Plateformes de l’accueil"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div
        className="platform-grid home-platforms"
        data-capacity={capacity}
        aria-live={auto ? 'off' : 'polite'}
      >
        {shown.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            count={games.filter((g) => g.platformId === p.id).length}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="home-platform-controls">
          <button
            type="button"
            className="icon-button"
            aria-label="Plateformes précédentes"
            onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {' '}
            {page + 1} / {pageCount}{' '}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Plateformes suivantes"
            onClick={() => setPage((current) => (current + 1) % pageCount)}
          >
            <ChevronRight size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={auto ? 'Mettre le défilement en pause' : 'Lancer le défilement automatique'}
            onClick={() => {
              setPaused(auto)
              if (!auto) setReducedMotion(false)
            }}
          >
            {auto ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      )}
    </div>
  )
}
