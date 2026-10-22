import { createFileRoute } from '@tanstack/react-router'
import { useLibrary } from '../components/ui'
import { Gallery } from '../components/gallery'
import { discoverySearch } from '../lib/gallery'
export const Route = createFileRoute('/discover')({
  validateSearch: (input) => discoverySearch.parse(input),
  component: Discover,
})
function Discover() {
  const { games } = useLibrary()
  return (
    <div className="page discovery-page">
      <Gallery games={games} defaultScope="discover" discovery />
    </div>
  )
}
