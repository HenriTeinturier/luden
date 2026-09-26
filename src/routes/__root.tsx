import { createRootRoute, HeadContent, Outlet, Scripts, Link } from '@tanstack/react-router'
import { libraryFn } from '../server/functions'
import { Shell } from '../components/shell'
import { Notifications } from '../components/notifications'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  loader: () => libraryFn(),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Luden — Votre vie de joueur' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'theme-color', content: '#1d1728' },
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Root,
  notFoundComponent: () => (
    <div className="empty-state">
      <h1>Cette page s’est égarée.</h1>
      <Link to="/" className="button">
        Revenir à l’accueil
      </Link>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="empty-state">
      <h1>Une petite pause technique.</h1>
      <p>La page n’a pas pu être chargée. Tes données restent dans ta base locale.</p>
      <button className="button" onClick={reset}>
        Réessayer
      </button>
    </div>
  ),
})
function Root() {
  const data = Route.useLoaderData()
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <Notifications>
          <Shell library={data.library}>
            {data.library ? (
              <Outlet />
            ) : (
              <div className="empty-state">
                <span className="eyebrow">Connexion à la bibliothèque</span>
                <h1>Retrouvons vos jeux.</h1>
                <p>{data.error}</p>
                <button className="button" onClick={() => window.location.reload()}>
                  Réessayer
                </button>
              </div>
            )}
          </Shell>
        </Notifications>
        <Scripts />
      </body>
    </html>
  )
}
