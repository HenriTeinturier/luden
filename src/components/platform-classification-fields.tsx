import { platformCategoryLabels, type PlatformCategory } from '../lib/platforms'
import type { Platform } from '../lib/types'

export function PlatformCategoriesField({
  value,
  onChange,
}: {
  value: PlatformCategory[]
  onChange: (categories: PlatformCategory[]) => void
}) {
  return (
    <fieldset className="platform-categories-field">
      <legend>Catégories · plusieurs choix possibles</legend>
      {(Object.entries(platformCategoryLabels) as [PlatformCategory, string][]).map(
        ([category, label]) => (
          <label key={category}>
            <input
              type="checkbox"
              checked={value.includes(category)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, category]
                    : value.filter((item) => item !== category),
                )
              }
            />
            {label}
          </label>
        ),
      )}
    </fieldset>
  )
}

export function PlatformCatalogField({
  value,
  onChange,
  platforms,
}: {
  value: string | null
  onChange: (id: string | null) => void
  platforms: Platform[]
}) {
  return (
    <label className="platform-catalog-field">
      Catalogue de jeux associé
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">Aucun catalogue associé</option>
        {platforms
          .filter((platform) => !platform.ownerId)
          .map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.catalogName}
            </option>
          ))}
      </select>
      <small>
        {value === 'pc'
          ? 'Les recherches utilisent le catalogue PC. Les jeux restent dans votre plateforme personnelle.'
          : 'Facultatif : utilise les métadonnées de ce catalogue, avec des fiches et des visuels indépendants. Sans association, l’ajout manuel et la recherche globale restent disponibles.'}
      </small>
    </label>
  )
}
