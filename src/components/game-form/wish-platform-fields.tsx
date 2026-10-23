import { useId, useState } from 'react'
import { useLibrary } from '../ui'
import type { GameFieldsProps } from './field-types'

export function WishPlatformFields({ data, change }: GameFieldsProps) {
  const { platforms } = useLibrary()
  const [query, setQuery] = useState('')
  const hintId = useId()
  const selected = data.alternativePlatformIds ?? []
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr')
  const candidates = platforms.filter((p) => p.id !== data.platformId)
  const shown = candidates.filter(
    (p) => selected.includes(p.id) || normalize(p.name).includes(normalize(query.trim())),
  )
  return (
    <fieldset className="wish-platform-fields" aria-describedby={hintId}>
      <legend>Autres plateformes envisagées</legend>
      <p id={hintId} className="field-hint">
        L’une ou l’autre vous convient. Une seule envie, avec les mêmes flammes et la même boîte,
        apparaîtra dans chaque univers coché.
      </p>
      <label>
        Rechercher une plateforme
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="PC, PlayStation…"
        />
      </label>
      <div className="wish-platform-options">
        {shown.map((platform) => (
          <label key={platform.id} className="check-inline">
            <input
              type="checkbox"
              checked={selected.includes(platform.id)}
              onChange={(event) =>
                change(
                  'alternativePlatformIds',
                  event.target.checked
                    ? [...selected, platform.id]
                    : selected.filter((id) => id !== platform.id),
                )
              }
            />
            {platform.name}
          </label>
        ))}
        {!shown.length && <p className="field-hint">Aucune plateforme correspondante.</p>}
      </div>
      <p className="field-hint">
        {selected.length
          ? `${selected.length} alternative${selected.length > 1 ? 's' : ''} sélectionnée${selected.length > 1 ? 's' : ''}. `
          : ''}
        Les parties et possessions restent propres à la plateforme préférée.
      </p>
    </fieldset>
  )
}
