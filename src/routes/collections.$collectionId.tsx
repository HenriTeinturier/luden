import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2, LockKeyhole } from 'lucide-react'
import { Confirm, PageHeading, useLibrary } from '../components/ui'
import { CollectionForm } from '../components/collection-form'
import { Gallery } from '../components/gallery'
import { gallerySearch } from '../lib/gallery'
import { deleteCollectionFn } from '../server/functions'
export const Route = createFileRoute('/collections/$collectionId')({
  validateSearch: (input) => gallerySearch.parse(input),
  component: CollectionPage,
})
function CollectionPage() {
  const { collectionId } = Route.useParams()
  const { collections, games } = useLibrary()
  const collection = collections.find((c) => c.id === collectionId)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const navigate = useNavigate()
  if (!collection)
    return (
      <div className="empty-state">
        <h1>Collection introuvable.</h1>
        <Link to="/collections">Mes collections</Link>
      </div>
    )
  return (
    <div className="page">
      <Link to="/collections" className="back-link">
        <ArrowLeft size={16} />
        Mes collections
      </Link>
      <PageHeading
        eyebrow={collection.kind === 'REAL' ? 'COLLECTION RÉELLE' : 'COLLECTION RÊVÉE'}
        title={collection.name}
        description={collection.description}
        action={
          <button className="button secondary" onClick={() => setOpen(true)}>
            <Pencil size={15} />
            Personnaliser
          </button>
        }
      />
      <div className="collection-context">
        <span>
          <LockKeyhole size={14} />
          Collection privée
        </span>
        <p>
          {collection.kind === 'REAL'
            ? 'Une sélection de jeux possédés aujourd’hui ou autrefois.'
            : 'Votre vitrine idéale. Aucune intention d’achat nécessaire.'}{' '}
          Ajoutez des jeux depuis leur fiche.
        </p>
      </div>
      <Gallery
        games={games.filter((g) => g.entries.some((e) => e.collectionId === collectionId))}
      />
      <div className="detail-danger">
        <Confirm
          title="Supprimer cette collection ?"
          description="La vitrine sera supprimée. Tous ses jeux, souvenirs et possessions resteront dans votre bibliothèque."
          onConfirm={() => {
            void (async () => {
              try {
                const result = await deleteCollectionFn({ data: collectionId })
                if (!result.ok) setError(result.error)
                else {
                  await router.invalidate()
                  await navigate({ to: '/collections' })
                }
              } catch {
                setError('La suppression a échoué.')
              }
            })()
          }}
        >
          <button className="text-link danger-text">
            <Trash2 size={14} />
            Supprimer la collection
          </button>
        </Confirm>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <CollectionForm open={open} onOpenChange={setOpen} collection={collection} />
    </div>
  )
}
