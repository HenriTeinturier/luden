import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, Plus, ArrowRight, Heart, BookOpen, Compass, Layers3 } from 'lucide-react'
import { SectionHeading, PlatformCard, GameCard, useLibrary } from '../components/ui'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const { games, platforms, collections } = useLibrary()
  const playing = games.filter((g) => g.experience?.status === 'PLAYING')
  const memories = games.filter((g) => g.experience?.memory)
  const chosen = [...platforms].sort(
    (a, b) =>
      games.filter((g) => g.platformId === b.id).length -
      games.filter((g) => g.platformId === a.id).length,
  )
  const shown = games.length
    ? chosen.slice(0, 4)
    : ['switch', 'ps5', 'pc', 'amiga']
        .map((id) => platforms.find((p) => p.id === id)!)
        .filter(Boolean)
  return (
    <div className="page">
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
            La première console. Une nuit à finir un niveau.
            <br />
            Un monde qu’on n’a jamais vraiment quitté.
            <br />
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
          },
          {
            icon: Heart,
            value: games.filter((g) => g.favorite).length,
            label: 'coups de cœur',
            to: '/library',
          },
          {
            icon: Compass,
            value: games.filter((g) => g.discover).length,
            label: 'aventures à découvrir',
            to: '/discover',
          },
          {
            icon: Layers3,
            value: collections.length,
            label: 'collections à parcourir',
            to: '/collections',
          },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to} className="stat">
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
      {games.length > 0 ? (
        <>
          <SectionHeading
            title={
              playing.length ? 'L’aventure continue.' : 'Les dernières pages de votre histoire.'
            }
            to="/library"
          />
          <div className="game-grid home-games">
            {(playing.length ? playing : games).slice(0, 5).map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </>
      ) : (
        <section className="first-page">
          <div className="first-page-art">
            <BookOpen size={38} strokeWidth={1} />
            <span>01</span>
          </div>
          <div>
            <span className="eyebrow">UNE PREMIÈRE PAGE À ÉCRIRE</span>
            <h2>Par quel jeu tout a commencé ?</h2>
            <p>Pas besoin de tout remplir. Un titre, une plateforme, et votre histoire commence.</p>
          </div>
          <Link to="/games/new" className="button secondary">
            <Plus size={17} />
            Ajouter un jeu
          </Link>
        </section>
      )}
      {memories.length > 0 && (
        <section className="memory-quote">
          <span className="eyebrow">UN SOUVENIR À REVISITER</span>
          <blockquote>
            « {memories[0].experience!.memory.slice(0, 280)}
            {memories[0].experience!.memory.length > 280 ? '…' : ''} »
          </blockquote>
          <Link to="/games/$gameId" params={{ gameId: memories[0].id }}>
            {memories[0].title} <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  )
}
