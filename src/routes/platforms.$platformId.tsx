import { createFileRoute, Link } from '@tanstack/react-router'
import { useLibrary } from '../components/ui'
import { Gallery } from '../components/gallery'
import { universeSearch } from '../lib/gallery'
import { platformPresentation } from '../lib/presentation'
import type { CSSProperties } from 'react'
export const Route = createFileRoute('/platforms/$platformId')({
  validateSearch: (input) => universeSearch.parse(input),
  component: PlatformPage,
})
function PlatformPage() {
  const { platformId } = Route.useParams()
  const search = Route.useSearch()
  const { platforms, games, machines } = useLibrary()
  const platform = platforms.find((p) => p.id === platformId)
  if (!platform)
    return (
      <div className="empty-state">
        <h1>Plateforme introuvable.</h1>
        <Link to="/platforms">Toutes les plateformes</Link>
      </div>
    )
  const chosen = games.filter((g) => g.platformId === platformId)
  const presentation = platformPresentation(platform)
  const gallery = presentation.gallery
  return (
    <div
      className={`page platform-page platform-${platformId} gallery-${gallery.appearance} ${gallery.wide && gallery.appearance !== 'legacy' ? 'gallery-wide' : ''} ${gallery.naturalImageHeight ? 'gallery-natural-height' : ''} ${gallery.imageRatio ? 'gallery-image-ratio' : ''}`}
      style={{ '--gallery-image-ratio': gallery.imageRatio } as CSSProperties}
      data-presentation={presentation.preset}
    >
      <h1 id="platform-overview-title" className="sr-only">
        {platform.name}
      </h1>
      {platformId === 'pc' && machines.length > 0 && (
        <div className="filter-tabs">
          <Link
            to="/platforms/$platformId"
            params={{ platformId }}
            search={{ ...search, machine: undefined }}
            className={!search.machine ? 'active' : ''}
          >
            Tous mes PC
          </Link>
          {machines.map((m) => (
            <Link
              key={m.id}
              to="/platforms/$platformId"
              params={{ platformId }}
              search={{ ...search, machine: m.id }}
              className={search.machine === m.id ? 'active' : ''}
            >
              {m.name}
            </Link>
          ))}
        </div>
      )}
      <Gallery games={chosen} platformLocked showStats />
    </div>
  )
}
