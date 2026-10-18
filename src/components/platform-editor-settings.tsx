import { type CSSProperties } from 'react'
import type { Platform } from '../lib/types'
import { PlatformCategoriesField, PlatformCatalogField } from './platform-classification-fields'
import { useLibrary } from './ui'
import { platformReleases } from '../lib/platform-releases'
import {
  platformPresentation,
  presentationPresets,
  sceneStyle,
  type PresentationPresetId,
} from '../lib/presentation'
import {
  readPlatformCustomization,
  type PlatformCustomization,
  type PlatformPlacement,
} from '../lib/platform-customization'

export const editorSections = {
  identity: 'Identité',
  card: 'Carte',
  games: 'Présentation des jeux',
  sidebar: 'Sidebar',
} as const
export type EditorSection = keyof typeof editorSections

function PlacementFields({
  value,
  onChange,
}: {
  value: PlatformPlacement
  onChange: (value: PlatformPlacement) => void
}) {
  const ranges: [keyof PlatformPlacement, string, number, number, string][] = [
    ['logoWidth', 'Largeur du logo', 10, 60, '%'],
    ['logoHeight', 'Hauteur maximale du logo', 30, 160, 'px'],
    ['logoY', 'Position verticale du logo', 0, 70, 'px'],
    ['hardwareWidth', 'Taille de la machine', 20, 100, '%'],
    ['hardwareX', 'Décalage horizontal de la machine', -30, 30, '%'],
    ['hardwareY', 'Décalage vertical de la machine', -30, 30, '%'],
    ['backgroundX', 'Cadrage horizontal du fond', 0, 100, '%'],
    ['backgroundY', 'Cadrage vertical du fond', 0, 100, '%'],
  ]
  return (
    <div className="platform-placement-fields">
      {ranges.map(([key, label, min, max, unit]) => (
        <label key={key}>
          {label}
          <span>
            {value[key]} {unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })}
          />
        </label>
      ))}
    </div>
  )
}

export function PlatformEditorSettings({
  section,
  platform,
  value,
  onChange,
  catalogPlatformId,
  onCatalogChange,
}: {
  section: EditorSection
  platform: Platform
  value: PlatformCustomization
  onChange: (value: PlatformCustomization) => void
  catalogPlatformId: string | null
  onCatalogChange: (id: string | null) => void
}) {
  const { platforms } = useLibrary()
  if (section === 'identity')
    return (
      <section className="platform-visual-section platform-identity-fields">
        <h2>Identité de la plateforme</h2>
        <p>
          Les champs laissés vides reprennent les valeurs{' '}
          {platform.ownerId ? 'définies à la création' : 'du catalogue'}.
        </p>
        <label>
          Titre
          <input
            maxLength={100}
            placeholder={platform.catalogName}
            value={value.title ?? ''}
            onChange={(event) => onChange({ ...value, title: event.target.value || null })}
          />
        </label>
        <label>
          Nom court
          <input
            maxLength={30}
            placeholder={platform.catalogShortName}
            value={value.shortName ?? ''}
            onChange={(event) => onChange({ ...value, shortName: event.target.value || null })}
          />
        </label>
        <label>
          Année ou période
          <input
            maxLength={9}
            placeholder={String(platformReleases[platform.id]?.year ?? '1998–2002')}
            value={value.dateLabel ?? ''}
            onChange={(event) => onChange({ ...value, dateLabel: event.target.value || null })}
          />
          <small>Une année (1998) ou une période (1998–2002).</small>
        </label>
        <label>
          Marque
          <input
            maxLength={50}
            placeholder={platform.catalogFamily}
            value={value.family ?? ''}
            onChange={(event) => onChange({ ...value, family: event.target.value || null })}
          />
        </label>
        <PlatformCategoriesField
          value={value.categories ?? platform.categories}
          onChange={(categories) => onChange({ ...value, categories })}
        />
        {platform.ownerId && (
          <PlatformCatalogField
            value={catalogPlatformId}
            onChange={onCatalogChange}
            platforms={platforms}
          />
        )}
        <p>
          {platform.ownerId ? 'Identité initiale' : 'Catalogue'} : {platform.catalogName} ·{' '}
          {platform.catalogFamily}
        </p>
        <button
          type="button"
          className="text-link"
          onClick={() =>
            onChange({
              ...value,
              title: null,
              shortName: null,
              dateLabel: platform.ownerId ? platform.era || null : null,
              family: null,
            })
          }
        >
          {platform.ownerId ? 'Rétablir l’identité initiale' : 'Rétablir l’identité du catalogue'}
        </button>
      </section>
    )
  if (section === 'games')
    return (
      <section className="platform-visual-section">
        <h2>Format des jeux</h2>
        <p>
          Le modèle définit les proportions des cartes de cet univers et la mise en scène
          boîte/support dans les fiches et la sidebar. La bibliothèque générale conserve son cadre
          commun.
        </p>
        <div className="platform-preset-options">
          <label>
            <input
              type="radio"
              name="presentation-preset"
              checked={value.preset === null}
              onChange={() => onChange({ ...value, preset: null })}
            />
            <strong>Présentation d’origine</strong>
            <small>
              {presentationPresets[platformPresentation(platform.id).preset].label} · conserve les
              ajustements de cette plateforme
            </small>
          </label>
          {Object.entries(presentationPresets).map(([id, preset]) => (
            <label key={id}>
              <input
                type="radio"
                name="presentation-preset"
                checked={value.preset === id}
                onChange={() => onChange({ ...value, preset: id as PresentationPresetId })}
              />
              <strong>{preset.label}</strong>
              <small>{preset.example}</small>
            </label>
          ))}
        </div>
      </section>
    )
  if (section === 'sidebar')
    return (
      <section className="platform-visual-section">
        <h2>Accueil de la sidebar</h2>
        <div className="platform-mode-options">
          <label>
            <input
              type="radio"
              name="sidebar-mode"
              checked={value.sidebarMode === 'artwork'}
              onChange={() => onChange({ ...value, sidebarMode: 'artwork' })}
            />
            Bandeau et affiches
          </label>
          <label>
            <input
              type="radio"
              name="sidebar-mode"
              checked={value.sidebarMode === 'composition'}
              onChange={() => onChange({ ...value, sidebarMode: 'composition' })}
            />
            Logo, fond et machine
          </label>
        </div>
        <p>
          {value.sidebarMode === 'composition'
            ? 'Les images de la carte sont reprises automatiquement. Vous pouvez choisir des variantes propres à la sidebar ci-dessous.'
            : 'Le bandeau reste fixe ; les affiches actives composent la galerie. Sans image active, l’identité de la plateforme sert de remplacement.'}
        </p>
        {value.sidebarMode === 'composition' && (
          <>
            <PlacementFields
              value={value.sidebar}
              onChange={(sidebar) => onChange({ ...value, sidebar })}
            />
            <button
              type="button"
              className="text-link"
              onClick={() => onChange({ ...value, sidebar: readPlatformCustomization({}).sidebar })}
            >
              Réinitialiser le placement
            </button>
          </>
        )}
      </section>
    )
  return (
    <section className="platform-visual-section">
      <h2>Composition de la carte</h2>
      <p>
        PNG ou WebP pour le logo et la machine, idéalement avec un fond transparent. Chaque image
        garde ses proportions.
      </p>
      <label className="platform-mode-options">
        <input
          type="checkbox"
          checked={value.cardEnabled}
          onChange={(event) => onChange({ ...value, cardEnabled: event.target.checked })}
        />
        Personnaliser le placement
      </label>
      {value.cardEnabled && (
        <PlacementFields value={value.card} onChange={(card) => onChange({ ...value, card })} />
      )}
    </section>
  )
}

export function PlatformPresetPreview({ platform }: { platform: Platform }) {
  const presentation = platformPresentation(platform)
  const preset = presentationPresets[presentation.preset]
  return (
    <div className="platform-preset-preview">
      <h3>Dans la collection</h3>
      <div
        className="preset-cover"
        style={{ aspectRatio: presentation.gallery.imageRatio ?? presentation.gallery.ratio }}
      >
        Boîte / jaquette
      </div>
      <p>Titre du jeu</p>
      <h3>Dans la sidebar du jeu</h3>
      <div className="preset-scene-frame">
        <div
          className={`game-scene without-background ${presentation.gallery.wide ? 'scene-wide-box' : ''}`}
          style={sceneStyle(presentation.scene) as CSSProperties}
        >
          <div className="scene-objects has-support">
            <div
              className="scene-box preset-object"
              style={{ aspectRatio: presentation.gallery.ratio }}
            >
              Boîte
            </div>
            <div className={`scene-support preset-object preset-support-${preset.support}`}>
              {preset.support === 'disc' || preset.support === 'mini-disc'
                ? 'Disque'
                : preset.support === 'floppy'
                  ? 'Disquette'
                  : 'Support'}
            </div>
          </div>
        </div>
      </div>
      <p className="field-hint">
        Schéma des proportions · les visuels de vos jeux restent inchangés.
      </p>
    </div>
  )
}
