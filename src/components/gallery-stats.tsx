import { BookOpen, Gamepad2, PackageCheck, Flame, Inbox } from 'lucide-react'
import { hasPlayed, needsSorting, librarySelection, type GallerySearch } from '../lib/gallery'
import type { Game } from '../lib/types'
import { MegastarTrophy } from './megastar-trophy'

export function GalleryStats({
  universe = false,
  games,
  onSelect,
  filters,
}: {
  universe?: boolean
  games: Game[]
  onSelect: (filters: Partial<GallerySearch>) => void
  filters: GallerySearch
}) {
  const stats = [
    {
      label: universe ? 'Tous les jeux' : 'jeux dans ma bibliothèque',
      count: games.length,
      icon: BookOpen,
      tone: 'library',
    },
    {
      label: 'jeux joués',
      count: games.filter(hasPlayed).length,
      icon: Gamepad2,
      tone: 'played',
    },
    {
      label: 'Mes envies',
      count: games.filter((game) => game.discover).length,
      icon: Flame,
      tone: 'desire',
    },
    {
      label: 'jeux possédés',
      count: games.filter((game) =>
        game.possessions.some((possession) => possession.state === 'CURRENT'),
      ).length,
      icon: PackageCheck,
      tone: 'owned',
    },
    {
      label: 'Megastar',
      count: games.filter((game) => game.favorite).length,
      icon: MegastarTrophy,
      tone: 'favorites',
    },
    {
      label: 'À trier',
      count: games.filter(needsSorting).length,
      icon: Inbox,
      tone: 'sorting',
    },
  ]
  return (
    <section
      className="platform-overview library-overview"
      aria-label={
        universe ? 'Statistiques de cet univers' : 'Statistiques de toute ma bibliothèque'
      }
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="platform-overview-stats">
        {stats.map(({ label, count, icon: Icon, tone }) => {
          const percent = games.length ? Math.round((count / games.length) * 100) : 0
          return (
            <button
              key={tone}
              type="button"
              className={`platform-overview-stat stat-${tone}`}
              aria-pressed={librarySelection(filters) === tone}
              onClick={() =>
                onSelect({
                  q: '',
                  machine: undefined,
                  platform: '',
                  scope:
                    tone === 'played'
                      ? 'played'
                      : tone === 'desire'
                        ? 'discover'
                        : tone === 'sorting'
                          ? 'unassigned'
                          : 'all',
                  owned: tone === 'owned' ? 'current' : 'all',
                  favorite: tone === 'favorites',
                })
              }
            >
              <span className="library-stat-icon" aria-hidden="true">
                <Icon size={25} />
              </span>
              <div>
                <span className="library-stat-label">{label}</span>
                <span className="library-stat-value">
                  <strong>{count}</strong>
                  {tone !== 'library' && (
                    <span
                      className="platform-stat-percent"
                      aria-label={`${percent} % de ma bibliothèque`}
                    >
                      {percent}%
                    </span>
                  )}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
