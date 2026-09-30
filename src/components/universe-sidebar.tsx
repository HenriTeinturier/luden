import { X } from 'lucide-react'
import type { Platform } from '../lib/types'
import { PlatformArt } from './ui'

export function UniverseSidebar({
  platform,
  image,
  onClose,
}: {
  platform: Platform
  image?: string
  onClose: () => void
}) {
  return (
    <aside
      id="universe-sidebar"
      tabIndex={-1}
      className="game-sidebar universe-sidebar"
      aria-label={`Accueil de l’univers ${platform.name}`}
    >
      {image ? (
        <img
          className="universe-sidebar-image"
          src={image}
          alt={`Ambiance de l’univers ${platform.name}`}
        />
      ) : (
        <div className="universe-sidebar-fallback">
          <PlatformArt platform={platform} />
          <h2>{platform.name}</h2>
          <p>Vos jeux. Vos souvenirs.</p>
        </div>
      )}
      <button
        type="button"
        className="icon-button universe-sidebar-close"
        aria-label="Masquer la sidebar de l’univers"
        title="Masquer la sidebar · Échap"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </aside>
  )
}
