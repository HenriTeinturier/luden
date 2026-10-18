import { useState, type CSSProperties } from 'react'
import type { Platform } from '../lib/types'
import {
  platformPresentation,
  platformScenePresentation,
  presentationPresets,
  sceneStyle,
} from '../lib/presentation'
import { readPresentation } from '../lib/game-visuals'
import { GameCard, useLibrary } from './ui'
import { GameScene } from './game-scene'

export function PlatformPresetPreview({ platform }: { platform: Platform }) {
  const { games } = useLibrary()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const candidates = games.filter(
    (game) => game.coverId || game.media.some((media) => ['BOX', 'MEDIA'].includes(media.category)),
  )
  const ownGames = candidates.filter((game) => game.platformId === platform.id)
  const otherGames = candidates.filter((game) => game.platformId !== platform.id)
  const available = ownGames.length ? ownGames : otherGames
  const preferred =
    available.find(
      (game) =>
        readPresentation(game.presentation).support ||
        game.media.some((media) => media.category === 'MEDIA'),
    ) ?? available[0]
  const previewId =
    selectedId === ''
      ? ''
      : selectedId !== null && candidates.some((game) => game.id === selectedId)
        ? selectedId
        : (preferred?.id ?? '')
  const sample = candidates.find((game) => game.id === previewId)
  // Only the in-memory preview receives these settings; the example game's own platform is untouched.
  const game = sample ? { ...sample, platform, platformId: platform.id } : null
  const presentation = platformPresentation(platform)
  const scene = platformScenePresentation(platform)
  const scenePreset = presentationPresets[scene.preset]
  return (
    <div className="platform-preset-preview">
      <label className="platform-preview-game-field">
        Jeu pour l’aperçu
        <select value={previewId} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="">Schéma des proportions</option>
          {ownGames.length > 0 && (
            <optgroup label="Jeux de cette plateforme">
              {ownGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </optgroup>
          )}
          {otherGames.length > 0 && (
            <optgroup label="Autres jeux de la bibliothèque">
              {otherGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} · {game.platform.shortName}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <p className="field-hint">
        {sample
          ? `Exemple : ${sample.title} (${sample.platform.name}). Sa fiche et ses images restent inchangées.`
          : 'Le schéma reste disponible sans image. Vous pouvez aussi choisir un jeu de la bibliothèque comme exemple.'}
      </p>
      <h3>Dans la collection</h3>
      <p className="platform-preview-model">{presentationPresets[presentation.preset].label}</p>
      {game ? (
        <div
          className={`platform-game-card-preview gallery-${presentation.gallery.appearance} ${presentation.gallery.imageRatio ? 'gallery-image-ratio' : ''}`}
          style={{ '--gallery-image-ratio': presentation.gallery.imageRatio } as CSSProperties}
          data-presentation={presentation.preset}
        >
          <div className="game-grid">
            <GameCard game={game} preview />
          </div>
        </div>
      ) : (
        <>
          <div
            className="preset-cover"
            style={{ aspectRatio: presentation.gallery.imageRatio ?? presentation.gallery.ratio }}
          >
            Boîte / jaquette
          </div>
          <p>Titre du jeu</p>
        </>
      )}
      <h3>Dans la sidebar du jeu</h3>
      <p className="platform-preview-model">{scenePreset.label}</p>
      {game ? (
        <div
          className="dossier-compact platform-game-scene-preview"
          style={{ '--game-accent': platform.color } as CSSProperties}
        >
          <GameScene key={game.id} game={game} compact disabled />
        </div>
      ) : (
        <div className="preset-scene-frame">
          <div
            className={`game-scene without-background ${scene.gallery.wide ? 'scene-wide-box' : ''}`}
            style={sceneStyle(scene.scene) as CSSProperties}
            data-presentation={scene.preset}
          >
            <div className="scene-objects has-support">
              <div className="scene-box preset-object" style={{ aspectRatio: scene.gallery.ratio }}>
                Boîte
              </div>
              <div className={`scene-support preset-object preset-support-${scenePreset.support}`}>
                {scenePreset.support === 'disc' || scenePreset.support === 'mini-disc'
                  ? 'Disque'
                  : scenePreset.support === 'floppy'
                    ? 'Disquette'
                    : 'Support'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
