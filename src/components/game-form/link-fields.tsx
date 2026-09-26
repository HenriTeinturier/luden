import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { linkTypes, type LinkInput } from '../../lib/media'
import type { GameFieldsProps } from './field-types'

export function LinkFields({ data, change }: GameFieldsProps) {
  const links = data.links ?? []
  const update = (next: LinkInput[]) =>
    change(
      'links',
      next.map((link, position) => ({ ...link, position })),
    )
  function move(from: number, to: number) {
    const next = [...links]
    ;[next[from], next[to]] = [next[to], next[from]]
    update(next)
  }
  return (
    <>
      {[true, false].map((video) => {
        const visible = links
          .map((link, index) => ({ link, index }))
          .filter(({ link }) => (link.type === 'VIDEO') === video)
        return (
          <details className="media-group" key={String(video)} open={visible.length > 0}>
            <summary>
              {video ? 'Vidéos' : 'Liens'}
              <span>{visible.length}</span>
            </summary>
            {visible.map(({ link, index }, position) => (
              <div className="external-link-editor" key={index}>
                <label>
                  URL
                  <input
                    type="url"
                    required
                    value={link.url}
                    maxLength={2048}
                    placeholder={video ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
                    onChange={(e) =>
                      update(links.map((l, i) => (i === index ? { ...l, url: e.target.value } : l)))
                    }
                  />
                </label>
                <div className="form-row">
                  <label>
                    Titre
                    <input
                      value={link.title}
                      maxLength={200}
                      placeholder="Facultatif"
                      onChange={(e) =>
                        update(
                          links.map((l, i) => (i === index ? { ...l, title: e.target.value } : l)),
                        )
                      }
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={link.type}
                      onChange={(e) =>
                        update(
                          links.map((l, i) =>
                            i === index ? { ...l, type: e.target.value as LinkInput['type'] } : l,
                          ),
                        )
                      }
                    >
                      {Object.entries(linkTypes).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="media-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Avancer le lien"
                    disabled={position === 0}
                    onClick={() => move(index, visible[position - 1].index)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Reculer le lien"
                    disabled={position === visible.length - 1}
                    onClick={() => move(index, visible[position + 1].index)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Retirer le lien"
                    onClick={() => update(links.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-link add-row"
              disabled={links.length >= 100}
              onClick={() =>
                update([
                  ...links,
                  { url: '', title: '', type: video ? 'VIDEO' : 'OTHER', position: links.length },
                ])
              }
            >
              <Plus size={16} />
              {video ? 'Ajouter une vidéo' : 'Ajouter un lien'}
            </button>
            <p className="field-hint">
              Seul le lien est conservé. Aucun téléchargement de vidéo ou de site.
            </p>
          </details>
        )
      })}
    </>
  )
}
