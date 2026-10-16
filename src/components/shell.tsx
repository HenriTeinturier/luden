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
  Menu,
  ChevronDown,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Library } from '../lib/types'
import { FormActionContext, type FormAction } from './form-action'
import { GameExplorer } from './game-explorer'

const navigation = [
  { to: '/', label: 'Vue d’ensemble', icon: Home },
  { to: '/library', label: 'Ma bibliothèque', icon: BookOpen },
  { to: '/platforms', label: 'Mes plateformes', icon: Gamepad2 },
  { to: '/discover', label: 'À découvrir', icon: Compass },
  { to: '/collections', label: 'Mes collections', icon: Layers3 },
] as const

export function Shell({ children, library }: { children: ReactNode; library: Library | null }) {
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!header.current) return
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height}px`,
      )
    })
    observer.observe(header.current)
    return () => observer.disconnect()
  }, [])
  const pathname = useLocation({ select: (l) => l.pathname })
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  useEffect(() => {
    setSearch('')
  }, [pathname])
  const [menuOpen, setMenuOpen] = useState(false)
  const [formAction, setFormAction] = useState<FormAction | null>(null)
  const currentPlatform = library?.platforms.find(
    (platform) => pathname.replace(/\/$/, '') === `/platforms/${platform.id}`,
  )
  const universes =
    library?.platforms.filter((p) => library.games.some((g) => g.platformId === p.id)) ?? []
  return (
    <FormActionContext.Provider value={setFormAction}>
      <div className="app-shell horizontal-shell">
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <header className="site-header" ref={header}>
          <div className="header-primary">
            <Link to="/" className="brand" aria-label="Luden, accueil">
              <img src="/luden-logo.svg" alt="" width="150" height="32" />
            </Link>
            <button
              type="button"
              className="button secondary header-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="header-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />} Menu
            </button>
            <div
              id="header-menu"
              className={`header-menu ${menuOpen ? 'is-open' : ''}`}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
              }}
            >
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
                {universes.length > 0 && (
                  <details
                    className="universe-menu"
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.currentTarget.open = false
                        event.currentTarget.querySelector('summary')?.focus()
                      }
                    }}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                        event.currentTarget.open = false
                    }}
                  >
                    <summary className="nav-item">
                      <Gamepad2 size={18} /> Mes univers <ChevronDown size={14} />
                    </summary>
                    <div className="universe-links">
                      {universes.map((p) => (
                        <Link
                          key={p.id}
                          to="/platforms/$platformId"
                          params={{ platformId: p.id }}
                          className="platform-nav"
                          onClick={(event) => {
                            const menu = event.currentTarget.closest('details')
                            if (menu) menu.open = false
                          }}
                        >
                          <span className="color-dot" style={{ background: p.color }} />
                          {p.shortName}
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </nav>

              <div className="header-account">
                <Link
                  to="/settings"
                  className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                >
                  <Settings2 size={18} />
                  Paramètres
                </Link>
                <div className="profile-chip">
                  <span className="avatar">
                    {library?.profile.name.charAt(0).toUpperCase() ?? 'L'}
                  </span>
                  <div>
                    {library?.profile.name ?? 'Ma vie de joueur'}
                    <small>Bibliothèque personnelle</small>
                  </div>
                </div>
              </div>
            </div>
            {universes.length > 0 && (
              <nav className="universe-shortcuts" aria-label="Accès direct aux univers">
                {universes.map((platform) => (
                  <Link
                    key={platform.id}
                    to="/platforms/$platformId"
                    params={{ platformId: platform.id }}
                    className={`universe-shortcut ${currentPlatform?.id === platform.id ? 'active' : ''}`}
                    aria-current={currentPlatform?.id === platform.id ? 'page' : undefined}
                    title={platform.name}
                  >
                    <span className="color-dot" style={{ background: platform.color }} />
                    {platform.shortName}
                  </Link>
                ))}
              </nav>
            )}
            <div className="topbar-actions">
              <form
                className="global-search"
                onSubmit={(e) => {
                  e.preventDefault()
                  void navigate({ to: '/library', search: { q: search } })
                  setSearch('')
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
                  className="button button-sm header-add-game"
                >
                  <Plus size={17} />
                  Ajouter un jeu
                </Link>
              )}
            </div>
          </div>
        </header>
        <div className="workspace">
          <main id="main" tabIndex={-1}>
            <GameExplorer library={library}>{children}</GameExplorer>
          </main>
          <footer className="footer">
            <div className="local-note">
              <span className="live-dot" />
              Un espace rien qu’à vous<small>Vos jeux. Vos souvenirs. Chez vous.</small>
            </div>

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
