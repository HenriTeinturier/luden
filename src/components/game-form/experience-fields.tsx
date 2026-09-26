import { RatingInput } from '../rating'
import { Heart } from 'lucide-react'
import { playStatuses } from '../../lib/platforms'
import type { GameInput } from '../../lib/validation'
import type { GameFieldsProps, ChangeExperienceField } from './field-types'

export function ExperienceFields({
  data,
  change,
  experience,
}: GameFieldsProps & { experience: ChangeExperienceField }) {
  return (
    <section className="form-section">
      <div className="form-section-title">
        <span>02</span>
        <h2>Votre expérience.</h2>
        <small>Facultatif</small>
      </div>
      <div className="form-row">
        <label>
          Où en êtes-vous ?
          <select
            value={data.experience.status}
            onChange={(e) =>
              experience('status', e.target.value as GameInput['experience']['status'])
            }
          >
            {Object.entries(playStatuses).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <RatingInput
          value={data.experience.rating}
          onChange={(value) => experience('rating', value)}
        />
      </div>
      <label>
        Un souvenir, un avis
        <textarea
          className="memory-input"
          rows={4}
          maxLength={20000}
          value={data.experience.memory}
          onChange={(e) => experience('memory', e.target.value)}
          placeholder="Ce moment qui vous revient. Avec qui vous jouiez. Ce que ce jeu vous a laissé…"
        />
      </label>
      <label>
        Quand y avez-vous joué ?
        <input
          maxLength={200}
          value={data.experience.period}
          onChange={(e) => experience('period', e.target.value)}
          placeholder="Été 2004, vers mes 12 ans, en ce moment…"
        />
      </label>
      <label className="check-card">
        <input
          type="checkbox"
          checked={data.favorite}
          onChange={(e) => change('favorite', e.target.checked)}
        />
        <Heart size={18} />
        <span>Un de mes coups de cœur</span>
      </label>
    </section>
  )
}
