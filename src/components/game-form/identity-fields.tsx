import { ChevronDown } from 'lucide-react'
import { useLibrary } from '../ui'
import type { GameFieldsProps } from './field-types'
import { WishPlatformFields } from './wish-platform-fields'
import { Link } from '@tanstack/react-router'
import { hasVersionHistory } from '../../lib/wish-platforms'
import type { Game } from '../../lib/types'

export function IdentityFields({
  data,
  change,
  existingGame,
}: GameFieldsProps & { existingGame?: Game }) {
  const library = useLibrary()
  const preserveHistory = Boolean(
    existingGame &&
    (existingGame.discover || data.discover) &&
    hasVersionHistory(existingGame) &&
    (existingGame.alternativePlatformIds.length || data.alternativePlatformIds?.length),
  )
  return (
    <section className="form-section">
      <div className="form-section-title">
        <span>01</span>
        <h2>Le jeu, sur sa plateforme.</h2>
      </div>
      <label>
        Titre du jeu <span className="required">*</span>
        <input
          required
          maxLength={200}
          value={data.title}
          onChange={(e) => change('title', e.target.value)}
          placeholder="Le nom de cette aventure"
        />
      </label>
      <div className="form-row">
        <label>
          {data.discover ? 'Plateforme préférée' : 'Plateforme'} <span className="required">*</span>
          <select
            required
            disabled={preserveHistory || Boolean(data.wishSourceId)}
            value={data.platformId}
            onChange={(e) => {
              change('platformId', e.target.value)
              change('machineId', null)
            }}
          >
            <option value="">Choisir une plateforme</option>
            {library.platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Année de sortie
          <input
            type="number"
            min={1950}
            max={2100}
            value={data.releaseYear ?? ''}
            onChange={(e) => change('releaseYear', e.target.value ? Number(e.target.value) : null)}
            placeholder="Facultative"
          />
        </label>
      </div>
      {data.discover && data.platformId && <WishPlatformFields data={data} change={change} />}
      {preserveHistory && (
        <div className="wish-platform-summary">
          <p>
            Votre histoire sur {existingGame!.platform.shortName} reste dans cette fiche. Pour jouer
            ou posséder une autre version :
          </p>
          {existingGame!.discover &&
            library.platforms
              .filter((p) => existingGame!.alternativePlatformIds.includes(p.id))
              .map((p) => (
                <Link
                  key={p.id}
                  to="/games/new"
                  search={{ platform: p.id, fromWish: existingGame!.id }}
                  className="text-link"
                >
                  Créer une fiche pour cette version : {p.shortName}
                </Link>
              ))}
          {!existingGame!.alternativePlatformIds.length && (
            <p>Enregistrez les alternatives pour pouvoir créer la fiche d’une autre version.</p>
          )}
        </div>
      )}
      {data.platformId === 'pc' && library.machines.length > 0 && (
        <label>
          Mon PC
          <select
            value={data.machineId ?? ''}
            onChange={(e) => change('machineId', e.target.value || null)}
          >
            <option value="">Sans PC particulier</option>
            {library.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Anciennes machines conservées. Les nouvelles se créent comme plateformes.
          </span>
        </label>
      )}
      <label>
        Catégorie de rangement
        <select
          value={data.categoryId ?? ''}
          onChange={(e) => change('categoryId', e.target.value || null)}
        >
          <option value="">À classer</option>
          {library.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <span className="field-hint">
          Facultative, pour regrouper tes jeux. Les genres IGDB restent indépendants.
        </span>
      </label>
      <details className="metadata-details">
        <summary>
          Développeur, genres et résumé <ChevronDown size={16} />
        </summary>
        <div className="form-row">
          <label>
            Développeur
            <input
              maxLength={300}
              value={data.developer}
              onChange={(e) => change('developer', e.target.value)}
            />
          </label>
          <label>
            Éditeur
            <input
              maxLength={300}
              value={data.publisher}
              onChange={(e) => change('publisher', e.target.value)}
            />
          </label>
        </div>
        <label>
          Genres, séparés par une virgule
          <input
            value={data.genres.join(', ')}
            onChange={(e) =>
              change(
                'genres',
                e.target.value.split(',').map((x) => x.trimStart()),
              )
            }
            onBlur={() => change('genres', data.genres.map((g) => g.trim()).filter(Boolean))}
            placeholder="Aventure, Plateforme…"
          />
        </label>
        <label>
          Résumé
          <textarea
            rows={4}
            maxLength={12000}
            value={data.summary}
            onChange={(e) => change('summary', e.target.value)}
          />
        </label>
        <p className="field-hint">
          Ces informations appartiennent à cette fiche. Une autre plateforme aura sa propre version.
        </p>
      </details>
    </section>
  )
}
