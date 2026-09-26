import { createFileRoute, Link } from '@tanstack/react-router'
import { PlatformArt, useLibrary } from '../components/ui'
import { Gallery } from '../components/gallery'
import { gallerySearch, hasPlayed } from '../lib/gallery'
import type { CSSProperties } from 'react'
export const Route = createFileRoute('/platforms/$platformId')({
  validateSearch: (input) => gallerySearch.parse(input),
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
  const isSnes = platformId === 'snes'
  return (
    <div className={`page ${isSnes ? 'platform-snes' : ''}`}>
      <section
        className="platform-hero"
        style={{ '--platform-color': platform.color } as CSSProperties}
      >
        <div>
          <span className="eyebrow">
            {isSnes ? 'Nintendo / L’univers 16 bits' : `${platform.family} / ${platform.era}`}
          </span>
          <h1>
            {isSnes ? (
              <img
                className="snes-hero-logo"
                src="/platforms/snes/logo.webp"
                alt={platform.name}
                width={800}
                height={169}
              />
            ) : (
              <>
                {platform.name}
                <span>.</span>
              </>
            )}
          </h1>
          <p>
            {isSnes
              ? 'Les jeux restent. Les souvenirs aussi.'
              : `${chosen.length} jeux. Autant d’histoires à raconter.`}
          </p>
          <div className="platform-hero-tags">
            <span>{chosen.filter(hasPlayed).length} joués</span>
            <span>{chosen.filter((g) => g.favorite).length} coups de cœur</span>
          </div>
        </div>
        {isSnes ? (
          <img
            className="snes-console"
            src="/platforms/snes/console.webp"
            alt="Super Nintendo et sa manette PAL"
            width={800}
            height={497}
          />
        ) : (
          <PlatformArt platform={platform} />
        )}
      </section>
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
      <Gallery games={chosen} platformLocked defaultScope={isSnes ? 'played' : undefined} />
    </div>
  )
}
