import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, Plus, ArrowRight, Trophy, BookOpen, Compass, Layers3 } from 'lucide-react'
import { SectionHeading, PlatformCard, GameCard, Cover, useLibrary } from '../components/ui'
import { useGameSelection } from '../components/game-selection'

const allLibraryGames = {
  scope: 'all' as const,
  favorite: false,
  owned: 'all' as const,
  souvenir: false,
  platform: '',
  machine: '',
  status: '',
  q: '',
}

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const selection = useGameSelection()
  const { games, platforms, collections } = useLibrary()
  const playing = games.filter((g) => g.experience?.status === 'PLAYING')
  const memories = games.filter((g) => g.experience?.memory)
  const recentGames = (playing.length ? playing : games).slice(0, 12)
  const recentSequence = recentGames.map((game) => game.id)
  const chosen = [...platforms].sort(
    (a, b) =>
      games.filter((g) => g.platformId === b.id).length -
        games.filter((g) => g.platformId === a.id).length ||
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }),
  )
  const shown = games.length
    ? chosen.slice(0, 4)
    : ['switch', 'ps5', 'pc', 'amiga']
        .map((id) => platforms.find((p) => p.id === id)!)
        .filter(Boolean)
  return (
    <div className="page home-page">
      <div className="home-top">
        <div className="home-intro">
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span /> PRESS START · REPRENDRE SES SOUVENIRS
              </span>
              <h1>
                Une vie de jeux.
                <br />
                <em>Et tant d’histoires.</em>
              </h1>
              <p>
                La première console. Une nuit à finir un niveau. <br />
                Un monde qu’on n’a jamais vraiment quitté. <br />
                Gardez une place pour tous ces moments.
              </p>
              <Link to={games.length ? '/library' : '/games/new'} className="button light">
                {games.length ? 'Parcourir mes souvenirs' : 'Commencer mon histoire'}
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-art arcade-art" aria-hidden="true">
              <img src="/arcade-room.svg" alt="" />
              <span className="hero-art-caption">PLAYER 01 · TOUJOURS UNE PARTIE EN MÉMOIRE</span>
            </div>
          </section>
          <div className="stats-row">
            {[
              {
                icon: BookOpen,
                value: games.length,
                label: 'jeux dans votre histoire',
                to: '/library',
                search: allLibraryGames,
              },
              {
                icon: Trophy,
                value: games.filter((g) => g.favorite).length,
                label: 'Megastar',
                to: '/library',
                search: {
                  ...allLibraryGames,
                  favorite: true,
                },
              },
              {
                icon: Compass,
                value: games.filter((g) => g.discover).length,
                label: 'envies de jouer',
                to: '/library',
                search: { ...allLibraryGames, scope: 'discover' as const },
              },
              {
                icon: Layers3,
                value: collections.length,
                label: 'collections à parcourir',
                to: '/collections',
              },
            ].map((stat) => (
              <Link key={stat.label} to={stat.to} search={stat.search} className="stat">
                <span className="stat-icon">
                  <stat.icon size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <strong>{stat.value.toString().padStart(2, '0')}</strong>
                  <span>{stat.label}</span>
                </div>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </div>
        <section className="home-universes" aria-label="Vos univers">
          <SectionHeading
            title="À chaque machine, son univers."
            to="/platforms"
            label="Toutes les plateformes"
          />
          <div className="platform-grid home-platforms">
            {shown.map((p) => (
              <PlatformCard
                key={p.id}
                platform={p}
                count={games.filter((g) => g.platformId === p.id).length}
              />
            ))}
          </div>
        </section>
      </div>
      <div className={`home-stories${memories.length ? ' has-memory' : ''}`}>
        {games.length > 0 ? (
          <section className="home-recent">
            <SectionHeading
              title={
                playing.length ? 'L’aventure continue.' : 'Les dernières pages de votre histoire.'
              }
              to="/library"
            />
            <div data-library-theme="1">
              <div className="game-grid home-games">
                {recentGames.map((g) => (
                  <GameCard key={g.id} game={g} sequence={recentSequence} overview />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="first-page">
            <div className="first-page-art">
              <BookOpen size={38} strokeWidth={1} />
              <span>01</span>
            </div>
            <div>
              <span className="eyebrow">UNE PREMIÈRE PAGE À ÉCRIRE</span>
              <h2>Par quel jeu tout a commencé ?</h2>
              <p>
                Pas besoin de tout remplir. Un titre, une plateforme, et votre histoire commence.
              </p>
            </div>
            <Link to="/games/new" className="button secondary">
              <Plus size={17} />
              Ajouter un jeu
            </Link>
          </section>
        )}
        {memories.length > 0 && (
          <aside className="memory-quote" aria-label="Un souvenir à revisiter">
            <span className="eyebrow">UN SOUVENIR À REVISITER</span>
            <Cover game={memories[0]} className="memory-cover" sizes="160px" />
            <blockquote>
              « {memories[0].experience!.memory.slice(0, 280)}
              {memories[0].experience!.memory.length > 280 ? '…' : ''} »
            </blockquote>
            <Link
              to="/games/$gameId"
              params={{ gameId: memories[0].id }}
              data-game-id={memories[0].id}
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
                selection.open(
                  memories[0].id,
                  memories.map((game) => game.id),
                  event.currentTarget,
                )
              }}
            >
              <span>
                {memories[0].title}
                <small>Revoir ce souvenir</small>
              </span>{' '}
              <ArrowRight size={16} />
            </Link>
          </aside>
        )}
      </div>
    </div>
  )
}
