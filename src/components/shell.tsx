import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  Compass,
  Gamepad2,
  Home,
  Layers3,
  Plus,
  Search,
  Settings2,
  Sparkles,
  ArrowUpRight,
  Check,
  LoaderCircle,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Library } from '../lib/types'
import { FormActionContext, type FormAction } from './form-action'

const navigation = [
  { to: '/', label: 'Vue d’ensemble', icon: Home },
  { to: '/library', label: 'Ma bibliothèque', icon: BookOpen },
  { to: '/platforms', label: 'Mes plateformes', icon: Gamepad2 },
  { to: '/discover', label: 'À découvrir', icon: Compass },
  { to: '/collections', label: 'Mes collections', icon: Layers3 },
] as const

export function Shell({ children, library }: { children: ReactNode; library: Library | null }) {
  const pathname = useLocation({ select: (l) => l.pathname })
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [formAction, setFormAction] = useState<FormAction | null>(null)
  const currentPlatform = library?.platforms.find(
    (platform) => pathname.replace(/\/$/, '') === `/platforms/${platform.id}`,
  )
  const currentSection = navigation.find((n) =>
    n.to === '/' ? pathname === '/' : pathname.startsWith(n.to),
  )
  const favorites =
    library?.platforms
      .filter((p) => library.games.some((g) => g.platformId === p.id))
      .slice(0, 6) ?? []
  return (
    <FormActionContext.Provider value={setFormAction}>
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <aside className="sidebar">
          <Link to="/" className="brand" aria-label="Luden, accueil">
            <picture className="brand-art">
              <source media="(max-width: 980px)" srcSet="/favicon.svg" />
              <img src="/luden-logo.svg" alt="" width="190" height="40" />
            </picture>
          </Link>
          <div className="sidebar-caption">VOTRE VIE DE JOUEUR</div>
          <nav aria-label="Navigation principale">
            {navigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-item ${(to === '/' ? pathname === '/' : pathname.startsWith(to)) ? 'active' : ''}`}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {to === '/library' && <small>{library?.games.length ?? 0}</small>}
              </Link>
            ))}
          </nav>
          {favorites.length > 0 && (
            <div className="sidebar-platforms">
              <span className="sidebar-caption">MES UNIVERS</span>
              {favorites.map((p) => (
                <Link
                  key={p.id}
                  to="/platforms/$platformId"
                  params={{ platformId: p.id }}
                  className="platform-nav"
                >
                  <span className="color-dot" style={{ background: p.color }} />
                  {p.shortName}
                </Link>
              ))}
            </div>
          )}
          <div className="sidebar-bottom">
            <div className="local-note">
              <span className="live-dot" />
              Un espace rien qu’à vous<small>Vos jeux. Vos souvenirs. Chez vous.</small>
            </div>
            <Link to="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
              <Settings2 size={18} />
              Paramètres
            </Link>
            <div className="profile-chip">
              <span className="avatar">{library?.profile.name.charAt(0).toUpperCase() ?? 'L'}</span>
              <div>
                {library?.profile.name ?? 'Ma vie de joueur'}
                <small>Bibliothèque personnelle</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className={`topbar ${formAction ? 'topbar-saving' : ''}`}>
            <nav className="topbar-breadcrumb" aria-label="Fil d’Ariane">
              <Link to="/">Mon espace</Link>
              <span aria-hidden="true">/</span>
              {currentPlatform ? (
                <>
                  <Link to="/platforms">Mes plateformes</Link>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{currentPlatform.name}</span>
                </>
              ) : (
                <span aria-current="page">
                  {currentSection?.label ??
                    (pathname.startsWith('/games') ? 'Fiche de jeu' : 'Paramètres')}
                </span>
              )}
            </nav>
            <div className="topbar-actions">
              <form
                className="global-search"
                onSubmit={(e) => {
                  e.preventDefault()
                  void navigate({ to: '/library', search: { q: search } })
                }}
              >
                <Search size={17} />
                <input
                  aria-label="Rechercher dans ma bibliothèque"
                  placeholder="Retrouver un jeu…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" aria-label="Lancer la recherche">
                  <ArrowUpRight size={15} />
                </button>
              </form>
              {formAction ? (
                <button
                  type="submit"
                  form={formAction.formId}
                  className="button button-sm"
                  disabled={formAction.busy || formAction.uploading}
                >
                  {formAction.busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {formAction.busy
                    ? 'Enregistrement…'
                    : formAction.uploading
                      ? 'Import en cours…'
                      : 'Enregistrer'}
                </button>
              ) : (
                <Link
                  to="/games/new"
                  search={{ platform: currentPlatform?.id }}
                  className="button button-sm"
                >
                  <Plus size={17} />
                  Ajouter un jeu
                </Link>
              )}
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <footer className="footer">
            <span>
              luden<span className="brand-dot">.</span>{' '}
              <span>Une vie de jeux, une collection de souvenirs.</span>
            </span>
            <span>
              <Sparkles size={12} /> Édition personnelle · v0.1
            </span>
          </footer>
        </div>
      </div>
    </FormActionContext.Provider>
  )
}
