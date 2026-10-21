import { useState, type PointerEvent } from 'react'
import { Star, X } from 'lucide-react'

export function EditableStars({
  value,
  disabled,
  onChange,
  label = 'Ma note',
}: {
  label?: string
  value: number | null
  disabled: boolean
  onChange: (value: number | null) => void
}) {
  const [preview, setPreview] = useState<number | null>(null)
  function pointerValue(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    return Math.max(
      0.5,
      Math.min(5, Math.ceil(((event.clientX - bounds.left) / bounds.width) * 10) / 2),
    )
  }
  return (
    <div className="editable-rating">
      <span className="rating-caption">{value === null ? `${label} · à noter` : label}</span>
      <div className="editable-rating-controls">
        <div
          className="editable-stars"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${label} sur 5`}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={value ?? 0}
          aria-valuetext={
            value === null ? 'Sans note' : `${value.toLocaleString('fr-FR')} sur 5 étoiles`
          }
          aria-disabled={disabled}
          title="Noter par demi-étoiles · flèches au clavier · Suppr pour effacer"
          onPointerMove={(event) => {
            if (!disabled) setPreview(pointerValue(event))
          }}
          onPointerLeave={() => setPreview(null)}
          onPointerCancel={() => setPreview(null)}
          onPointerUp={(event) => {
            if (disabled || event.button !== 0) return
            event.currentTarget.focus({ preventScroll: true })
            setPreview(null)
            onChange(pointerValue(event))
          }}
          onKeyDown={(event) => {
            const steps: Record<string, number> = {
              ArrowRight: 0.5,
              ArrowUp: 0.5,
              ArrowLeft: -0.5,
              ArrowDown: -0.5,
            }
            if (
              !(event.key in steps) &&
              !['Home', 'End', 'Delete', 'Backspace'].includes(event.key)
            )
              return
            event.preventDefault()
            event.stopPropagation()
            if (disabled) return
            setPreview(null)
            onChange(
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? 5
                  : ['Delete', 'Backspace'].includes(event.key)
                    ? null
                    : Math.max(0, Math.min(5, (value ?? 0) + steps[event.key])),
            )
          }}
        >
          <Stars value={preview ?? value ?? 0} />
        </div>
        <button
          type="button"
          className="rating-clear"
          aria-label={`Effacer : ${label}`}
          title={`Effacer : ${label}`}
          disabled={disabled || value === null}
          onClick={() => onChange(null)}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

export function Stars({
  value,
  showEmpty = false,
}: {
  value: number | null | undefined
  showEmpty?: boolean
}) {
  if (value == null && !showEmpty) return <span className="unrated">Pas encore noté</span>
  return (
    <span
      className="stars"
      role="img"
      aria-label={
        value == null ? 'Pas encore noté' : `${value.toLocaleString('fr-FR')} sur 5 étoiles`
      }
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span className="star" key={n}>
          <Star size={18} />
          <span style={{ width: `${Math.max(0, Math.min(1, (value ?? 0) - n + 1)) * 100}%` }}>
            <Star size={18} fill="currentColor" />
          </span>
        </span>
      ))}
      {value != null && <small>{value.toLocaleString('fr-FR')}</small>}
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
