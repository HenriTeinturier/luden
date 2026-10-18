import type { Platform } from '../lib/types'
import type { PlatformVisual } from '../lib/platform-visuals'
import { platformArtwork } from '../lib/platform-artwork'
import {
  platformPresentation,
  platformScenePresentation,
  presentationPresets,
} from '../lib/presentation'
import { useLibrary } from './ui'
import type { EditorSection } from './platform-editor-settings'

export function PlatformCreationReview({
  platform,
  visuals,
  onEdit,
}: {
  platform: Platform
  visuals: PlatformVisual[]
  onEdit: (section: EditorSection) => void
}) {
  const { platforms } = useLibrary()
  const config = platform.customization
  const artwork = platformArtwork(platform.id, config, visuals)
  const catalog = platforms.find((item) => item.id === platform.catalogPlatformId)
  const categories = { COMPUTER: 'Ordinateur', CONSOLE: 'Console de salon', HANDHELD: 'Portable' }
  const cardAssets = [
    ['Logo', artwork.logo],
    ['Fond', artwork.background],
    ['Machine', artwork.hardware],
  ]
  const sidebarAssets = [
    ['Logo', artwork.sidebarLogo],
    ['Fond', artwork.sidebarBackground],
    ['Machine', artwork.sidebarHardware],
  ]
  const assetSummary = (assets: (string | undefined)[][]) =>
    assets.map(([label, url]) => `${label} : ${url ? 'prêt' : 'sans image'}`).join(' · ')
  const activePosters = visuals.filter((item) => item.active && item.kind === 'POSTER').length
  const sections: { key: EditorSection; title: string; rows: [string, string][] }[] = [
    {
      key: 'identity',
      title: 'Identité',
      rows: [
        ['Titre', platform.name],
        ['Nom court', platform.shortName],
        ['Marque', platform.family],
        ['Année ou période', config.dateLabel || 'Non renseignée'],
        ['Rubriques', platform.categories.map((category) => categories[category]).join(' · ')],
        ['Catalogue de jeux', catalog?.name ?? 'Aucun catalogue associé'],
      ],
    },
    { key: 'card', title: 'Carte de plateforme', rows: [['Visuels', assetSummary(cardAssets)]] },
    {
      key: 'games',
      title: 'Présentation des jeux',
      rows: [
        ['Collection', presentationPresets[platformPresentation(platform).preset].label],
        [
          'Sidebar et fiche du jeu',
          presentationPresets[platformScenePresentation(platform).preset].label,
        ],
      ],
    },
    {
      key: 'sidebar',
      title: 'Accueil de la sidebar',
      rows:
        config.sidebarMode === 'composition'
          ? [
              ['Mode', 'Composition logo, fond et machine'],
              ['Visuels', assetSummary(sidebarAssets)],
            ]
          : [
              ['Mode', 'Bandeau et affiches'],
              [
                'Bandeau',
                visuals.some((item) => item.active && item.kind === 'BANNER')
                  ? 'Prêt'
                  : 'Sans image',
              ],
              ['Affiches', `${activePosters} active${activePosters !== 1 ? 's' : ''}`],
              [
                'Défilement',
                platform.slideshowEnabled
                  ? activePosters >= 2
                    ? `Toutes les ${platform.slideshowSeconds} secondes`
                    : 'Automatique · nécessite deux affiches actives'
                  : 'Manuel',
              ],
            ],
    },
  ]
  return (
    <section className="platform-creation-review">
      <h2>Votre plateforme est prête à être créée</h2>
      <p className="muted">
        Vérifiez vos choix. Les images et les réglages pourront être complétés après la création.
      </p>
      {sections.map(({ key, title, rows }) => (
        <section className="platform-review-section" key={key}>
          <div className="platform-visual-heading">
            <h3>{title}</h3>
            <button
              type="button"
              className="text-link"
              onClick={() => onEdit(key)}
              aria-label={`Modifier : ${title}`}
            >
              Modifier
            </button>
          </div>
          <dl>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p className="field-hint">
        La création rendra cette plateforme disponible dans Mes plateformes et pour l’ajout de jeux.
      </p>
    </section>
  )
}
