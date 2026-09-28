import { Stars } from '../components/rating'
import { coverFormat } from '../lib/presentation'
import { GameMedia } from '../components/game-media'
import { useNotification } from '../components/notifications'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Pencil,
  Heart,
  Disc3,
  Cloud,
  Clock3,
  Trash2,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { Cover, Confirm, useLibrary } from '../components/ui'
import { GameForm } from '../components/game-form'
import { deleteGameFn } from '../server/functions'
import { playStatuses } from '../lib/platforms'
import { gameReturnSearch } from '../lib/gallery'
export const Route = createFileRoute('/games/$gameId')({
  validateSearch: (input) => gameReturnSearch.parse(input),
  component: GamePage,
})
function GamePage() {
  const notify = useNotification()
  const { gameId } = Route.useParams()
  const { games, collections, platforms } = useLibrary()
  const origin = Route.useSearch()
  const sourcePlatform =
    origin.from === 'platform' ? platforms.find((p) => p.id === origin.fromId) : undefined
  const sourceCollection =
    origin.from === 'collection' ? collections.find((c) => c.id === origin.fromId) : undefined
  const game = games.find((g) => g.id === gameId)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const router = useRouter()
  if (!game)
    return (
      <div className="empty-state">
        <h1>Ce jeu n’est plus dans la bibliothèque.</h1>
        <Link to="/library">Revenir à mes jeux</Link>
      </div>
    )
  if (editing)
    return (
      <GameForm game={game} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
    )
  const inCollections = collections.filter((c) => game.entries.some((e) => e.collectionId === c.id))
  return (
    <div className={`page detail-page ${coverFormat(game.platformId).wide ? 'detail-wide' : ''}`}>
      <Link
        {...(sourcePlatform
          ? { to: '/platforms/$platformId' as const, params: { platformId: sourcePlatform.id } }
          : sourceCollection
            ? {
                to: '/collections/$collectionId' as const,
                params: { collectionId: sourceCollection.id },
              }
            : { to: origin.from === 'discover' ? ('/discover' as const) : ('/library' as const) })}
        search={origin.filters ?? {}}
        className="back-link"
      >
        <ArrowLeft size={16} />
        {sourcePlatform
          ? `Retour à ${sourcePlatform.name}`
          : sourceCollection
            ? `Retour à ${sourceCollection.name}`
            : origin.from === 'discover'
              ? 'Retour aux jeux à découvrir'
              : 'Retour à ma bibliothèque'}
      </Link>
      <div className="detail-layout">
        <aside className="detail-cover-column">
          <Cover game={game} className="detail-cover" />
          <span className="detail-cover-caption">
            {game.platform.name} {game.releaseYear ? `· ${game.releaseYear}` : ''}
          </span>
          <button className="button full" onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Modifier ma fiche
          </button>
        </aside>
        <div className="detail-content">
          <div className="detail-tags">
            <Link
              to="/platforms/$platformId"
              params={{ platformId: game.platformId }}
              className="platform-pill"
              style={{ color: game.platform.color }}
            >
              {game.platform.name}
            </Link>
            {game.machine && <span className="tag">{game.machine.name}</span>}
            {game.favorite && (
              <span className="favorite-label">
                <Heart size={15} fill="currentColor" />
                Coup de cœur
              </span>
            )}
          </div>
          <h1>{game.title}</h1>
          <div className="detail-byline">
            {[game.developer, game.releaseYear, game.genres.join(' · ')]
              .filter(Boolean)
              .join(' / ')}
          </div>
          <section className="experience-card">
            <div className="experience-top">
              <span className="eyebrow">MON EXPÉRIENCE</span>
              <span
                className={`status-pill ${game.experience?.status === 'PLAYING' ? 'playing' : ''}`}
              >
                {playStatuses[game.experience?.status ?? 'UNPLAYED']}
              </span>
            </div>
            <div className="experience-body">
              <Stars value={game.experience?.rating} />
              <div>
                {game.experience?.memory ? (
                  <div>
                    <p className="detail-memory">
                      {game.experience.memory.slice(0, 240)}
                      {game.experience.memory.length > 240 ? '…' : ''}
                    </p>
                    {game.experience.memory.length > 240 && (
                      <details className="detail-expand">
                        <summary>Lire tout mon avis</summary>
                        <p className="full-memory">{game.experience.memory}</p>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="muted">Un souvenir à écrire, quand l’envie viendra.</p>
                )}
                {game.experience?.period && (
                  <span className="period">
                    <Clock3 size={14} />
                    {game.experience.period}
                  </span>
                )}
              </div>
            </div>
          </section>
          <details className="detail-expand">
            <summary>
              Possessions & collections{' '}
              <span>
                {game.possessions.length} possession(s) · {inCollections.length} collection(s)
              </span>
            </summary>
            <div className="detail-two-columns">
              <section>
                <h2>Mes possessions</h2>
                {game.possessions.length ? (
                  game.possessions.map((p) => (
                    <div key={p.id} className="possession-detail">
                      {p.format === 'PHYSICAL' ? <Disc3 size={22} /> : <Cloud size={22} />}
                      <div>
                        <strong>
                          {p.format === 'PHYSICAL'
                            ? 'Édition physique'
                            : p.store || 'Version digitale'}
                        </strong>
                        <span>
                          {p.state === 'CURRENT'
                            ? 'Dans ma bibliothèque aujourd’hui'
                            : 'Possédé autrefois'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Aucune possession renseignée.</p>
                )}
              </section>
              <section>
                <h2>Mes collections</h2>
                {inCollections.length ? (
                  inCollections.map((c) => (
                    <Link
                      key={c.id}
                      to="/collections/$collectionId"
                      params={{ collectionId: c.id }}
                      className="collection-detail"
                    >
                      <span>
                        {c.kind === 'DREAM' ? <Sparkles size={18} /> : <LockKeyhole size={18} />}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.kind === 'DREAM' ? 'Collection rêvée' : 'Collection réelle'}
                        </small>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="muted">Ce jeu ne fait partie d’aucune collection.</p>
                )}
              </section>
            </div>
          </details>
          {game.discover && (
            <div className="discovery-note">
              <Sparkles size={18} />À découvrir ou à rejouer{' '}
              {game.desire != null && (
                <strong>Envie : {game.desire.toLocaleString('fr-FR')}/5</strong>
              )}
            </div>
          )}
          {(game.summary || game.publisher || game.igdbId) && (
            <details className="game-about detail-expand">
              <summary>À propos de cette version</summary>
              {game.summary && <p>{game.summary}</p>}
              {game.publisher && <p className="muted">Éditeur : {game.publisher}</p>}
              {game.igdbId && (
                <p className="field-hint">
                  Informations initiales issues d’
                  <a href="https://www.igdb.com" target="_blank" rel="noreferrer">
                    IGDB
                  </a>
                  , modifiables dans votre fiche. Les métadonnées d’autres plateformes peuvent
                  différer.
                </p>
              )}
            </details>
          )}
          <GameMedia game={game} />
          <div className="detail-danger">
            <Confirm
              title={`Supprimer « ${game.title} » ?`}
              confirmLabel="Oui, supprimer ce jeu"
              description="Le jeu, son expérience et ses associations aux collections seront supprimés. Les copies locales des images qui ne sont plus utilisées seront également supprimées."
              onConfirm={() => {
                void (async () => {
                  try {
                    const result = await deleteGameFn({ data: game.id })
                    if (!result.ok) setError(result.error)
                    else {
                      await router.invalidate()
                      await navigate({ to: '/library' })
                      notify('Le jeu a été supprimé de votre bibliothèque.')
                    }
                  } catch {
                    setError('La suppression a échoué.')
                  }
                })()
              }}
            >
              <button type="button" className="text-link danger-text">
                <Trash2 size={14} />
                Supprimer cette fiche
              </button>
            </Confirm>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
