import { createFileRoute, Link } from '@tanstack/react-router'
import { useLibrary } from '../components/ui'
import { PlatformVisualForm } from '../components/platform-visual-form'

export const Route = createFileRoute('/platforms/$platformId_/edit')({ component: EditPlatform })
function EditPlatform() {
  const { platformId } = Route.useParams()
  const library = useLibrary()
  const platform = [...library.platforms, ...library.platformDrafts].find(
    (p) => p.id === platformId,
  )
  if (!platform)
    return (
      <div className="empty-state">
        <h1>Plateforme introuvable.</h1>
        <Link to="/platforms">Toutes les plateformes</Link>
      </div>
    )
  return (
    <PlatformVisualForm
      key={platformId}
      platform={platform}
      visuals={library.platformVisuals.filter((v) => v.platformId === platformId)}
    />
  )
}
