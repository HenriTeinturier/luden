import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import type { Game } from '../lib/types'
import { mediaCategories, linkTypes } from '../lib/media'
import { Modal } from './ui'
import { mediaImageSources } from '../lib/image-variants'

export function GameMedia({
  game,
  hideScreenshots = false,
}: {
  game: Game
  hideScreenshots?: boolean
}) {
  const [selected, setSelected] = useState<Game['media'][number] | null>(null)
  if (!game.media.length && !game.links.length) return null
  return (
    <section className="game-media game-about">
      <h2>Médias & liens</h2>
      {Object.entries(mediaCategories).map(([category, label]) => {
        if (hideScreenshots && category === 'SCREENSHOT') return null
        const images = game.media.filter((m) => m.category === category)
        if (!images.length) return null
        return (
          <div className="media-display-group" key={category}>
            <h3>
              {label} <small>{images.length}</small>
            </h3>
            <div className="media-display-grid">
              {images.map((item) => (
                <figure key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    aria-label={`Agrandir ${item.caption || label}`}
                  >
                    <img
                      {...mediaImageSources(
                        `/media/${item.mediaId}`,
                        item.media.width,
                        'auto, (max-width: 800px) 40vw, 240px',
                      )}
                      alt={item.caption || label}
                      loading="lazy"
                    />
                  </button>
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )
      })}
      {[true, false].map((video) => {
        const links = game.links.filter((l) => (l.type === 'VIDEO') === video)
        return (
          links.length > 0 && (
            <div className="media-display-group" key={String(video)}>
              <h3>{video ? 'Vidéos' : 'Liens'}</h3>
              {links.map((link) => (
                <a
                  key={link.id}
                  className="game-external-link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {video ? <Play size={18} /> : <ExternalLink size={18} />}
                  <span>
                    <strong>{link.title || new URL(link.url).hostname}</strong>
                    <small>
                      {linkTypes[link.type]} · {new URL(link.url).hostname}
                    </small>
                  </span>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          )
        )
      })}
      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.caption || (selected ? mediaCategories[selected.category] : 'Image')}
        description={
          selected
            ? `${selected.media.width} × ${selected.media.height} · ${selected.media.source === 'IGDB' ? 'IGDB' : selected.media.source === 'UPLOAD' ? 'Image personnelle' : 'Importée depuis un lien'}`
            : ''
        }
      >
        {selected && (
          <a href={`/media/${selected.mediaId}`} target="_blank" rel="noreferrer">
            <img
              className="media-lightbox"
              src={`/media/${selected.mediaId}`}
              alt={selected.caption || 'Image du jeu'}
            />
          </a>
        )}
      </Modal>
    </section>
  )
}
