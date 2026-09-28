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
  const isAmiga = platformId === 'amiga'
  const isAmstrad = platformId === 'amstrad'
  return (
    <div
      className={`page platform-page ${isSnes || isAmiga || isAmstrad ? `platform-${platformId}` : ''}`}
    >
      <section
        className="platform-hero"
        style={{ '--platform-color': platform.color } as CSSProperties}
      >
        <div className="platform-hero-identity">
          <h1>
            {isSnes || isAmiga || isAmstrad ? (
              <img
                className={`${platformId}-hero-logo`}
                src={`/platforms/${platformId}/logo.webp`}
                alt={platform.name}
                width={isAmstrad ? 900 : 800}
                height={isAmstrad ? 375 : isAmiga ? 232 : 169}
              />
            ) : (
              <>
                {platform.name}
                <span>.</span>
              </>
            )}
          </h1>
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
        ) : isAmiga ? (
          <div className="amiga-hero-hardware" aria-hidden="true">
            <img
              className="amiga-joystick"
              src="/platforms/amiga/joystick.webp"
              alt=""
              width={600}
              height={548}
            />
            <img
              className="amiga-computer"
              src="/platforms/amiga/computer.webp"
              alt=""
              width={1000}
              height={695}
            />
          </div>
        ) : isAmstrad ? (
          <div className="amstrad-hero-hardware" aria-hidden="true">
            <img
              className="amstrad-disk"
              src="/platforms/amstrad/disk.webp"
              alt=""
              width={700}
              height={661}
            />
            <img
              className="amstrad-computer"
              src="/platforms/amstrad/computer.webp"
              alt=""
              width={1000}
              height={738}
            />
          </div>
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
      <Gallery games={chosen} platformLocked defaultScope="played" />
    </div>
  )
}
