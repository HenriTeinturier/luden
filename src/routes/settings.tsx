import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Check,
  Download,
  HardDrive,
  LockKeyhole,
  Database,
  Cloud,
  Trash2,
  Monitor,
} from 'lucide-react'
import { Confirm, PageHeading, useLibrary } from '../components/ui'
import { deleteMachineFn, saveProfileFn } from '../server/functions'
import { CategorySettings } from '../components/category-settings'
export const Route = createFileRoute('/settings')({ component: Settings })
function Settings() {
  const { profile, config, machines } = useLibrary()
  const [name, setName] = useState(profile.name)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  return (
    <div className="page settings-page">
      <PageHeading
        eyebrow="UN ESPACE À VOTRE IMAGE"
        title="Les petits réglages."
        description="Vos données vous appartiennent. Luden est là pour en prendre soin."
      />
      <CategorySettings />
      <section className="settings-section">
        <h2>Votre espace personnel</h2>
        <form
          className="profile-form"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setMessage('')
            try {
              const result = await saveProfileFn({ data: name })
              if (!result.ok) setMessage(result.error)
              else {
                await router.invalidate()
                setMessage('Nom enregistré.')
              }
            } catch {
              setMessage('Enregistrement impossible.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <label>
            Nom affiché
            <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="button secondary" disabled={busy}>
            <Check size={16} />
            Enregistrer
          </button>
        </form>
        <p className="field-hint">
          <LockKeyhole size={13} />
          Un profil local. Aucun compte ni donnée envoyée à un service de synchronisation.
        </p>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <HardDrive size={21} />
          <h2>Vos images, chez vous</h2>
          <span className={`status-pill ${config.mediaConfigured ? 'playing' : ''}`}>
            {config.mediaConfigured ? 'Chemin renseigné' : 'À configurer'}
          </span>
        </div>
        <p>
          Choisissez un dossier de votre disque, synchronisé par OneDrive si vous le souhaitez.
          Luden y conservera les images dans un sous-dossier <code>media</code>.
        </p>
        <div className="config-code">
          <span>Dans le fichier .env du projet</span>
          <code>LUDEN_DATA_DIR="C:/Users/vous/OneDrive/Luden"</code>
        </div>
        <p className="field-hint">
          Remplacez cet exemple par votre chemin, puis redémarrez l’application. Le dossier doit
          être disponible localement. Aucune racine n’est choisie automatiquement.
        </p>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <Cloud size={21} />
          <h2>Recherche de jeux avec IGDB</h2>
          <span className={`status-pill ${config.igdbConfigured ? 'playing' : ''}`}>
            {config.igdbConfigured ? 'Identifiants renseignés' : 'Facultatif'}
          </span>
        </div>
        <p>
          Préremplissez les fiches, puis adaptez-les à votre version. Les recherches utilisent
          Internet ; vos jeux enregistrés restent accessibles sans connexion.
        </p>
        <div className="config-code">
          <code>
            IGDB_CLIENT_ID="…"
            <br />
            IGDB_CLIENT_SECRET="…"
          </code>
        </div>
        <p className="field-hint">
          Configurez vos identifiants dans <code>.env</code> puis redémarrez Luden. Ne les partagez
          pas dans le dépôt.{' '}
          <a href="https://api-docs.igdb.com/#getting-started" target="_blank" rel="noreferrer">
            Documentation IGDB ↗
          </a>
        </p>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <Database size={21} />
          <h2>Emporter votre bibliothèque</h2>
        </div>
        <p>
          Un export lisible contenant vos fiches, notes, souvenirs, possessions, collections et les
          chemins relatifs des images.
        </p>
        <a href="/api/export" className="button secondary" download>
          <Download size={17} />
          Exporter mes données en JSON
        </a>
        <p className="field-hint">
          Les fichiers images ne sont pas inclus : conservez aussi votre dossier media. Cet export
          n’est pas une sauvegarde PostgreSQL. La réimportation n’est pas encore disponible.
        </p>
      </section>
      {machines.length > 0 && (
        <section className="settings-section">
          <h2>Mes PC personnels</h2>
          {machines.map((m) => (
            <div className="machine-setting" key={m.id}>
              <Monitor size={19} />
              <span>{m.name}</span>
              <Confirm
                title="Retirer ce PC ?"
                description="Vos jeux resteront dans la plateforme PC. Seul leur rattachement à cette machine sera retiré."
                onConfirm={() => {
                  void (async () => {
                    try {
                      const result = await deleteMachineFn({ data: m.id })
                      if (!result.ok) setMessage(result.error)
                      else await router.invalidate()
                    } catch {
                      setMessage('Impossible de retirer ce PC.')
                    }
                  })()
                }}
              >
                <button className="icon-button" aria-label={`Retirer ${m.name}`}>
                  <Trash2 size={16} />
                </button>
              </Confirm>
            </div>
          ))}
        </section>
      )}
      {message && (
        <p className="settings-message" role="status">
          {message}
        </p>
      )}
      <div className="privacy-note">
        <LockKeyhole size={24} />
        <div>
          <strong>Privé, par défaut et pour de bon.</strong>
          <p>
            Cette première version fonctionne uniquement sur votre PC. Les comptes et le partage de
            collections seront ajoutés dans une future version hébergée.
          </p>
        </div>
      </div>
    </div>
  )
}
