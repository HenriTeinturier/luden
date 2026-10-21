import { CirclePlay, Gamepad2, ShieldCheck, Sparkles, Inbox } from 'lucide-react'
import { hasPlayed, needsSorting } from '../lib/gallery'
import type { Game } from '../lib/types'
import { MegastarTrophy } from './megastar-trophy'

export function GalleryStats({ games }: { games: Game[] }) {
  const stats = [
    { label: 'jeux affichés', count: games.length, icon: Gamepad2, tone: 'library' },
    {
      label: 'jeux joués',
      count: games.filter(hasPlayed).length,
      icon: CirclePlay,
      tone: 'played',
    },
    {
      label: 'Mes envies',
      count: games.filter((game) => game.discover).length,
      icon: Sparkles,
      tone: 'desire',
    },
    {
      label: 'jeux possédés',
      count: games.filter((game) =>
        game.possessions.some((possession) => possession.state === 'CURRENT'),
      ).length,
      icon: ShieldCheck,
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
      aria-label="Statistiques des jeux affichés"
      aria-live="polite"
      aria-atomic="true"
    >
      <dl className="platform-overview-stats">
        {stats.map(({ label, count, icon: Icon, tone }) => {
          const percent = games.length ? Math.round((count / games.length) * 100) : 0
          return (
            <div key={tone} className={`platform-overview-stat stat-${tone}`}>
              <span className="library-stat-icon" aria-hidden="true">
                <Icon size={25} />
              </span>
              <div>
                <dt>{label}</dt>
                <dd>
                  <strong>{count}</strong>
                  {tone !== 'library' && (
                    <span
                      className="platform-stat-percent"
                      aria-label={`${percent} % des jeux affichés`}
                    >
                      {percent}%
                    </span>
                  )}
                </dd>
              </div>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
