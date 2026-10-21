import { createFileRoute } from '@tanstack/react-router'
import { useLibrary } from '../components/ui'
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
      <h1 className="sr-only">Ma bibliothèque</h1>
      <Gallery games={games} showStats />
    </div>
  )
}
