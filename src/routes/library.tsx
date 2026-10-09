import { createFileRoute } from '@tanstack/react-router'
import { PageHeading, useLibrary } from '../components/ui'
import { Gallery } from '../components/gallery'
import { gallerySearch } from '../lib/gallery'
export const Route = createFileRoute('/library')({
  validateSearch: (input) => gallerySearch.parse(input),
  component: Library,
})
function Library() {
  const { games } = useLibrary()
  return (
    <div className="page library-page">
      <PageHeading
        eyebrow="TOUS VOS UNIVERS"
        title="Ma bibliothèque."
        description="Joués, possédés ou simplement rêvés. Chaque jeu a sa place."
      />
      <Gallery games={games} />
    </div>
  )
}
