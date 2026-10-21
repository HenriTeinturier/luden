import { createFileRoute } from '@tanstack/react-router'
import { PageHeading, useLibrary } from '../components/ui'
import { Gallery } from '../components/gallery'
import { gallerySearch } from '../lib/gallery'
export const Route = createFileRoute('/discover')({
  validateSearch: (input) => gallerySearch.parse(input),
  component: Discover,
})
function Discover() {
  const { games } = useLibrary()
  return (
    <div className="page discovery-page">
      <PageHeading
        eyebrow="LA CURIOSITÉ N’A PAS D’ÂGE"
        title="La prochaine aventure."
        description="À essayer, à explorer ou à rejouer. Suivez votre envie, sans obligation de finir."
      />
      <Gallery games={games} defaultScope="discover" discovery />
    </div>
  )
}
