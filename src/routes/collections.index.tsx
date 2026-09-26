import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, LockKeyhole, ArrowUpRight, Sparkles, Layers3 } from 'lucide-react'
import { PageHeading, useLibrary } from '../components/ui'
import { CollectionForm } from '../components/collection-form'
export const Route = createFileRoute('/collections/')({ component: Collections })
function Collections() {
  const { collections, games } = useLibrary()
  const [open, setOpen] = useState(false)
  return (
    <div className="page">
      <PageHeading
        eyebrow="VOTRE CABINET DE CURIOSITÉS"
        title="Le plaisir de collectionner."
        description="Les trésors que vous avez. Ceux que vous imaginez. À chacun sa vitrine."
        action={
          <button className="button secondary" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Créer une collection
          </button>
        }
      />
      <div className="collections-grid">
        {collections.map((c) => {
          const items = games.filter((g) => g.entries.some((e) => e.collectionId === c.id))
          return (
            <Link
              key={c.id}
              to="/collections/$collectionId"
              params={{ collectionId: c.id }}
              className={`collection-card ${c.kind === 'DREAM' ? 'dream' : ''}`}
            >
              <div className="collection-card-label">
                <span>
                  {c.kind === 'REAL' ? <Layers3 size={16} /> : <Sparkles size={16} />}
                  {c.kind === 'REAL' ? 'COLLECTION RÉELLE' : 'COLLECTION RÊVÉE'}
                </span>
                <ArrowUpRight size={20} />
              </div>
              <div className="collection-shelf" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`shelf-cover shelf-${i}`}>
                    {items[i]?.coverUrl ? (
                      <img src={items[i].coverUrl!} alt="" loading="lazy" />
                    ) : (
                      <>
                        <span>{c.kind === 'DREAM' ? 'IMAGINE' : 'SOUVENIRS'}</span>
                        <i>{['✦', '◒', '✳'][i]}</i>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="collection-card-info">
                <div>
                  <h2>{c.name}</h2>
                  <p>{c.description || 'Une sélection personnelle, à votre image.'}</p>
                </div>
                <div className="collection-card-footer">
                  <span>
                    {items.length} jeu{items.length !== 1 ? 'x' : ''}
                  </span>
                  <span>
                    <LockKeyhole size={12} />
                    Privée
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
        <button className="new-collection-card" onClick={() => setOpen(true)}>
          <span>
            <Plus size={26} />
          </span>
          <h3>Une autre envie de collection ?</h3>
          <p>
            Un genre, une machine, un souvenir.
            <br />
            Créez une vitrine à votre image.
          </p>
        </button>
      </div>
      <CollectionForm open={open} onOpenChange={setOpen} />
    </div>
  )
}
