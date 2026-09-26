import { Star } from 'lucide-react'

export function Stars({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="unrated">Pas encore noté</span>
  return (
    <span
      className="stars"
      role="img"
      aria-label={`${value.toLocaleString('fr-FR')} sur 5 étoiles`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span className="star" key={n}>
          <Star size={18} />
          <span style={{ width: `${Math.max(0, Math.min(1, value - n + 1)) * 100}%` }}>
            <Star size={18} fill="currentColor" />
          </span>
        </span>
      ))}
      <small>{value.toLocaleString('fr-FR')}</small>
    </span>
  )
}

export function RatingInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <div className="rating-input">
      <Stars value={value} />
      <label>
        Votre note sur 5
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">Pas de note</option>
          {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString('fr-FR')} / 5
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
