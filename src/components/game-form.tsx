import { MediaFields } from './game-form/media-fields'
import { useNotification } from './notifications'
import { IdentityFields } from './game-form/identity-fields'
import { ExperienceFields } from './game-form/experience-fields'
import { PossessionFields } from './game-form/possession-fields'
import { useContext, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { FormActionContext } from './form-action'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Check, ImagePlus, Plus, Search, Sparkles, LoaderCircle } from 'lucide-react'
import { emptyGame, gameSchema, type GameInput } from '../lib/validation'
import type { Game } from '../lib/types'
import { saveGameFn, searchIgdbFn } from '../server/functions'
import { PageHeading, useLibrary } from './ui'

type SearchResult = Extract<Awaited<ReturnType<typeof searchIgdbFn>>, { ok: true }>['data'][number]

export function GameForm({
  game,
  onSaved,
  onCancel,
}: {
  game?: Game
  onSaved?: () => void
  onCancel?: () => void
}) {
  const library = useLibrary()
  const notify = useNotification()
  const [data, setData] = useState<GameInput>(() =>
    game
      ? {
          id: game.id,
          title: game.title,
          platformId: game.platformId,
          machineId: game.machineId,
          categoryId: game.categoryId,
          releaseYear: game.releaseYear,
          developer: game.developer,
          publisher: game.publisher,
          genres: game.genres,
          summary: game.summary,
          igdbId: game.igdbId,
          coverId: game.coverId,
          media: game.media.map(({ mediaId, category, position, caption, isPrimary }) => ({
            mediaId,
            category,
            position,
            caption,
            isPrimary,
          })),
          links: game.links.map(({ url, title, type, position }) => ({
            url,
            title,
            type,
            position,
          })),
          discover: game.discover,
          desire: game.desire,
          favorite: game.favorite,
          experience: game.experience
            ? {
                status: game.experience.status,
                rating: game.experience.rating,
                memory: game.experience.memory,
                period: game.experience.period,
              }
            : { ...emptyGame.experience },
          possessions: game.possessions.map((p) => ({
            id: p.id,
            format: p.format,
            state: p.state,
            store: p.store,
          })),
          collectionIds: game.entries.map((e) => e.collectionId),
        }
      : {
          ...structuredClone(emptyGame),
          experience: { ...emptyGame.experience, status: 'PLAYED' },
        },
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const formId = useId()
  const setFormAction = useContext(FormActionContext)
  const saving = useRef(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    setFormAction({ formId, busy, uploading })
    return () => setFormAction(null)
  }, [setFormAction, formId, busy, uploading])
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searchError, setSearchError] = useState('')
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const router = useRouter()
  const navigate = useNavigate()
  const change = <K extends keyof GameInput>(key: K, value: GameInput[K]) =>
    setData((d) => {
      const next = { ...d, [key]: value }
      if (key === 'media')
        next.coverId =
          (value as NonNullable<GameInput['media']>).find((m) => m.isPrimary)?.mediaId ?? null
      if (key === 'platformId' && selectedResult) {
        const igdbPlatform = library.platforms.find((p) => p.id === value)?.igdbId
        next.releaseYear =
          selectedResult.releases
            .filter((r) => r.platform === igdbPlatform)
            .sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity))[0]?.y ?? null
      }
      return next
    })
  const experience = <K extends keyof GameInput['experience']>(
    key: K,
    value: GameInput['experience'][K],
  ) => setData((d) => ({ ...d, experience: { ...d.experience, [key]: value } }))
  async function search() {
    if (query.trim().length < 2) return
    setSearching(true)
    setSearchError('')
    try {
      const result = await searchIgdbFn({
        data: { query, platformId: data.platformId || undefined },
      })
      if (result.ok) setResults(result.data)
      else setSearchError(result.error)
    } catch {
      setSearchError('La recherche n’a pas abouti. Vous pouvez ajouter le jeu manuellement.')
    } finally {
      setSearching(false)
    }
  }
  function select(result: SearchResult) {
    setSelectedResult(result)
    setData((d) => ({
      ...d,
      platformId: result.suggestedPlatformId ?? '',
      machineId: result.suggestedPlatformId === 'pc' ? d.machineId : null,
      title: result.title,
      summary: result.summary,
      releaseYear: result.releaseYear,
      developer: result.developer,
      publisher: result.publisher,
      genres: result.genres,
      igdbId: result.igdbId,
    }))
    setResults(null)
  }
  async function save(e: FormEvent) {
    e.preventDefault()
    if (saving.current || uploading) return
    setError('')
    const parsed = gameSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    saving.current = true
    setBusy(true)
    try {
      const result = await saveGameFn({ data: parsed.data })
      if (!result.ok) setError(result.error)
      else {
        // Finish refreshing loader data before navigating to the saved game/library.
        await router.invalidate({ sync: true })
        onSaved?.()
        if (game) {
          await navigate({ to: '/games/$gameId', params: { gameId: result.data.id } })
        } else {
          await navigate({
            to: '/platforms/$platformId',
            params: { platformId: parsed.data.platformId },
            search: {
              sort: 'recent',
              scope: parsed.data.experience.status === 'UNPLAYED' ? 'all' : 'played',
            },
          })
        }
        notify(
          game
            ? 'Les modifications du jeu sont enregistrées.'
            : 'Le jeu a été ajouté à votre bibliothèque.',
        )
      }
    } catch {
      setError('Enregistrement impossible. Vos champs ont été conservés, vous pouvez réessayer.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  return (
    <div className="page form-page">
      {game && onCancel ? (
        <button type="button" className="back-link text-link" onClick={onCancel}>
          <ArrowLeft size={16} />
          Retour à la fiche
        </button>
      ) : (
        <Link to="/library" className="back-link">
          <ArrowLeft size={16} />
          Ma bibliothèque
        </Link>
      )}
      <PageHeading
        eyebrow={game ? 'VOTRE HISTOIRE ÉVOLUE' : 'UNE NOUVELLE PAGE'}
        title={game ? 'Un souvenir à préciser.' : 'Quel jeu vous accompagne ?'}
        description="Un titre et une plateforme suffisent. Le reste peut attendre."
      />
      {!game && (
        <section className="import-panel">
          <div>
            <Sparkles size={19} />
            <strong>Un coup de pouce pour commencer</strong>
            <span>Rechercher une fiche sur IGDB</span>
          </div>
          <div className="import-search">
            <select
              aria-label="Plateforme pour la recherche"
              value={data.platformId}
              onChange={(e) => {
                change('platformId', e.target.value)
                change('machineId', null)
                setResults(null)
                setSelectedResult(null)
              }}
            >
              <option value="">Toutes les plateformes</option>
              {library.platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              aria-label="Titre à rechercher sur IGDB"
              placeholder="Zelda, Monkey Island, Half-Life…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void search()
                }
              }}
            />
            <button
              className="button secondary"
              type="button"
              disabled={searching || query.trim().length < 2 || !library.config.igdbConfigured}
              onClick={() => void search()}
            >
              {searching ? <LoaderCircle size={17} className="spin" /> : <Search size={17} />}
              Rechercher
            </button>
          </div>
          {!library.config.igdbConfigured && (
            <p className="field-hint">
              IGDB n’est pas configuré. L’ajout manuel ci-dessous est prêt à l’emploi.{' '}
              <Link to="/settings">Voir les paramètres</Link>
            </p>
          )}
          {searchError && (
            <p className="form-error" role="alert">
              {searchError}
            </p>
          )}
          {results && (
            <div className="igdb-results">
              {results.length ? (
                results.map((r) => (
                  <button key={r.igdbId} onClick={() => select(r)}>
                    {r.coverUrl ? (
                      <img src={r.coverUrl} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <ImagePlus size={22} />
                    )}
                    <span>
                      <strong>{r.title}</strong>
                      <small>
                        {r.releaseDate ?? r.releaseYear ?? 'Date inconnue'} ·{' '}
                        {r.platforms.map((p) => p.name).join(', ')}
                      </small>
                    </span>
                    <Plus size={17} />
                  </button>
                ))
              ) : (
                <p>
                  Aucun résultat. Essayez le titre original, ou complétez la fiche manuellement.
                </p>
              )}
            </div>
          )}
          {selectedResult && (
            <p className="success-note">
              <Check size={15} /> Fiche préremplie. Vérifiez les informations de cette version avant
              d’enregistrer.
            </p>
          )}
        </section>
      )}
      <form id={formId} onSubmit={save} className="game-form">
        <div className="form-main">
          <IdentityFields data={data} change={change} />
          <ExperienceFields data={data} change={change} experience={experience} />
          <PossessionFields data={data} change={change} />
          <MediaFields data={data} change={change} onBusyChange={setUploading} />
        </div>
        <aside className="form-aside">
          <section className="cover-editor">
            <span className="eyebrow">VOTRE IMAGE PRINCIPALE</span>
            <div className="cover-upload-preview">
              {data.coverId ? (
                <img src={`/media/${data.coverId}`} alt="Jaquette sélectionnée" />
              ) : (
                <>
                  <ImagePlus size={40} strokeWidth={1} />
                  <p>
                    La bonne jaquette.
                    <br />
                    Le bon souvenir.
                  </p>
                </>
              )}
            </div>
            <p className="field-hint">
              Choisissez votre image principale avec l’étoile dans « Médias & liens ».
            </p>
          </section>
          <section className="desire-panel">
            <span className="eyebrow">LA PROCHAINE AVENTURE ?</span>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={data.discover}
                onChange={(e) => change('discover', e.target.checked)}
              />
              À découvrir ou à rejouer
            </label>
            {data.discover && (
              <label>
                Mon envie /5
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={data.desire ?? ''}
                  onChange={(e) => change('desire', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Facultative"
                />
              </label>
            )}
            <p>Une envie peut attendre. Votre bibliothèque n’est pas une liste de tâches.</p>
          </section>
        </aside>
        <div className="form-savebar">
          {error && (
            <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">
              {error}
            </p>
          )}
          <span>Vos données restent dans votre bibliothèque.</span>
          <Link to="/library" className="button secondary">
            Annuler
          </Link>
          <button type="submit" className="button" disabled={busy || uploading}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
            {busy
              ? 'Enregistrement…'
              : game
                ? 'Enregistrer les modifications'
                : 'Ajouter à mon histoire'}
          </button>
        </div>
      </form>
    </div>
  )
}
