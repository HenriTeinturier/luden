import { useState } from 'react'
import { Crop, Upload, ImageIcon } from 'lucide-react'
import {
  defaultPresentation,
  readPresentation,
  visualRoles,
  type VisualRole,
} from '../../lib/game-visuals'
import { mediaCategories } from '../../lib/media'
import { Modal } from '../ui'
import { GameBackground } from '../game-background'
import type { GameFieldsProps } from './field-types'

export function VisualFields({
  data,
  change,
  upload,
  disabled,
}: GameFieldsProps & {
  upload: (file: File, role: VisualRole) => Promise<boolean>
  disabled: boolean
}) {
  const visuals = readPresentation(data.presentation)
  const [cropping, setCropping] = useState(false)
  const [draft, setDraft] = useState(visuals.sidebarCrop)
  const images = data.media ?? []
  function choose(role: VisualRole, id: string) {
    const next = { ...visuals, [role]: id || null }
    if (role === 'background') {
      next.sidebarCrop = defaultPresentation().sidebarCrop
      setDraft(next.sidebarCrop)
      setCropping(Boolean(id))
    }
    change('presentation', next)
  }
  return (
    <div className="visual-fields">
      <div className="visual-fields-heading">
        <div>
          <h3>La mise en scène du jeu</h3>
          <p>Quatre visuels facultatifs, une fiche à son image.</p>
        </div>
        <span className="tag">Sidebar & fiche complète</span>
      </div>
      <div className="visual-background-guide">
        <ImageIcon size={22} aria-hidden="true" />
        <div>
          <p>Fond du jeu · dimensions conseillées</p>
          <strong>
            2 560 × 1 440 px <span>(16:9)</span>
          </strong>
          <p>
            Une image sans texte, avec le sujet à distance des bords. Le cadrage pour la sidebar se
            règle après le choix du fond.
          </p>
        </div>
      </div>
      <div className="visual-slots">
        {(Object.entries(visualRoles) as [VisualRole, string][]).map(([role, label]) => {
          const automatic =
            role === 'box'
              ? (images.find((m) => m.category === 'BOX')?.mediaId ?? data.coverId)
              : role === 'support'
                ? images.find((m) => m.category === 'MEDIA')?.mediaId
                : null
          const id = visuals[role] ?? automatic
          return (
            <div className={`visual-slot visual-slot-${role}`} key={role}>
              <div className="visual-slot-preview">
                {id ? (
                  <img src={`/media/${id}`} alt={label} />
                ) : (
                  <ImageIcon size={28} strokeWidth={1} />
                )}
              </div>
              <label>
                {label}
                <select value={visuals[role] ?? ''} onChange={(e) => choose(role, e.target.value)}>
                  <option value="">
                    {role === 'box' || role === 'support'
                      ? 'Choix automatique'
                      : role === 'logo'
                        ? 'Titre en texte'
                        : 'Fond sobre'}
                  </option>
                  {images.map((m, index) => (
                    <option key={m.mediaId} value={m.mediaId}>
                      {m.caption || `${mediaCategories[m.category]} · image ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`button secondary upload-button ${disabled ? 'disabled' : ''}`}>
                <Upload size={14} />
                Importer
                <input
                  type="file"
                  aria-label={`Importer : ${label}`}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  disabled={disabled}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file)
                      void upload(file, role).then((ok) => {
                        if (ok && role === 'background') {
                          setDraft(defaultPresentation().sidebarCrop)
                          setCropping(true)
                        }
                      })
                  }}
                />
              </label>
              {role === 'box' && (
                <small>
                  En automatique : une image classée « Boîte », sinon l’image principale de la
                  bibliothèque (votre jaquette).
                </small>
              )}
              {role === 'logo' && (
                <small>
                  PNG ou WebP transparent conseillé. Sinon, le titre reste affiché en texte.
                </small>
              )}
              {role === 'background' && (
                <>
                  {visuals.background && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setDraft(visuals.sidebarCrop)
                        setCropping(true)
                      }}
                    >
                      <Crop size={14} />
                      Cadrer pour la sidebar
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="field-hint">
        Choisissez une image déjà enregistrée ou importez-la directement. L’étoile de la galerie
        reste le choix de la vignette de bibliothèque.
      </p>
      <Modal
        open={cropping && Boolean(visuals.background)}
        onOpenChange={setCropping}
        title="Le bon cadre pour la sidebar"
        description="Déplacez l’image, puis ajustez le zoom. Le fond de la fiche complète conserve son cadrage large."
      >
        <div className="crop-preview">
          {visuals.background && (
            <GameBackground
              key={visuals.background}
              mediaId={visuals.background}
              crop={draft}
              onChange={setDraft}
            />
          )}
          <div className="crop-preview-shade" />
          <span className="crop-preview-caption">Aperçu du fond de la sidebar</span>
        </div>
        <div className="crop-controls">
          <label>
            Zoom <output>{draft.zoom.toFixed(2)}×</output>
            <input
              type="range"
              aria-label="Zoom du fond"
              min={1}
              max={3}
              step={0.01}
              value={draft.zoom}
              onChange={(e) => setDraft({ ...draft, zoom: Number(e.target.value) })}
            />
          </label>
          <label>
            Horizontal
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={draft.x}
              onChange={(e) => setDraft({ ...draft, x: Number(e.target.value) })}
            />
          </label>
          <label>
            Vertical
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={draft.y}
              onChange={(e) => setDraft({ ...draft, y: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => setDraft(defaultPresentation().sidebarCrop)}
          >
            Recentrer
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              change('presentation', { ...visuals, sidebarCrop: draft })
              setCropping(false)
            }}
          >
            Valider le cadrage
          </button>
        </div>
        <p className="field-hint">
          Le cadrage sera sauvegardé avec la fiche. L’image n’est pas découpée.
        </p>
      </Modal>
    </div>
  )
}
