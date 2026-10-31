import { useRef, useState } from 'react'
import { Database, Download, Upload } from 'lucide-react'
import { Confirm } from './ui'

type Preview = { id: string; createdAt: string; games: number; images: number }
type SaveHandle = { createWritable(): Promise<WritableStream<Uint8Array>> }
type SaveWindow = Window & {
  showSaveFilePicker?: (options: { suggestedName: string }) => Promise<SaveHandle>
}

async function result(response: Response) {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Opération impossible.')
  return data
}

export function BackupSettings() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const input = useRef<HTMLInputElement>(null)
  async function backup() {
    setBusy(true)
    setMessage('Préparation de la sauvegarde… Vous pouvez laisser cette page ouverte.')
    try {
      // The picker must be invoked during the user gesture, before waiting for the server.
      const picker = (window as SaveWindow).showSaveFilePicker
      const handle = picker
        ? await picker.call(window, {
            suggestedName: `luden-${new Date().toISOString().slice(0, 10)}.luden.tar.gz`,
          })
        : undefined
      const data = await result(await fetch('/api/backup', { method: 'POST' }))
      const url = `/api/backup?id=${encodeURIComponent(data.id)}`
      if (handle) {
        const response = await fetch(url)
        if (!response.ok || !response.body)
          throw new Error(
            'Téléchargement impossible. La copie locale reste dans le dossier backups.',
          )
        await response.body.pipeTo(await handle.createWritable())
        setMessage(
          'Sauvegarde enregistrée. Une copie reste également dans le dossier backups de Luden.',
        )
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = ''
        document.body.append(link)
        link.click()
        link.remove()
        setMessage(
          'Sauvegarde créée, téléchargement lancé. Vérifiez sa réception dans votre navigateur. Une copie reste dans le dossier backups de Luden.',
        )
      }
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Enregistrement annulé.'
          : error instanceof Error
            ? error.message
            : 'Sauvegarde impossible.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function inspect(file: File) {
    setBusy(true)
    setPreview(null)
    setMessage('Envoi et vérification de la sauvegarde…')
    try {
      if (preview)
        await fetch('/api/restore', {
          method: 'DELETE',
          headers: { 'x-luden-restore-id': preview.id },
        })
      const data = await result(
        await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file,
        }),
      )
      setPreview(data)
      setMessage('Archive vérifiée. Confirmez ci-dessous pour remplacer la bibliothèque.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Vérification impossible.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  async function restore() {
    if (!preview) return
    setBusy(true)
    setMessage(
      'Vérification PostgreSQL, sauvegarde de sécurité et restauration… Ne fermez pas Luden.',
    )
    try {
      const data = await result(
        await fetch('/api/restore', {
          method: 'PUT',
          headers: {
            'x-luden-restore-id': preview.id,
            'x-luden-confirm': 'replace-trusted-backup',
          },
        }),
      )
      setPreview(null)
      setMessage(
        `Restauration terminée. Sauvegarde de sécurité : ${data.safetyId}.luden.tar.gz. Rechargez Luden pour afficher la bibliothèque restaurée.`,
      )
    } catch (error) {
      setPreview(null)
      setMessage(error instanceof Error ? error.message : 'Restauration impossible.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="settings-section" aria-busy={busy}>
      <div className="settings-title">
        <Database size={21} />
        <h2>Sauvegarde et restauration</h2>
      </div>
      <p>
        Emportez vos fiches, souvenirs, collections, réglages de plateformes et images dans une
        seule archive. Les miniatures seront recréées automatiquement.
      </p>
      <p>
        <strong>Non inclus :</strong> le mot de passe PostgreSQL, les identifiants IGDB et le
        fichier <code>.env</code>. Sur une autre installation, configurez vos propres identifiants.
      </p>
      <div className="backup-actions">
        <button className="button secondary" disabled={busy} onClick={() => void backup()}>
          <Download size={17} />
          Créer une sauvegarde complète
        </button>
        <button className="button secondary" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={17} />
          Restaurer une sauvegarde
        </button>
        <input
          ref={input}
          type="file"
          accept=".gz,.tgz"
          hidden
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void inspect(file)
          }}
        />
      </div>
      <p className="field-hint">
        Le choix du dossier dépend du navigateur. Si aucune fenêtre ne s’ouvre, activez « Toujours
        demander où enregistrer les fichiers » dans ses paramètres. Une copie est conservée dans{' '}
        <code>LUDEN_DATA_DIR/backups</code>.
      </p>
      <p className="field-hint">
        Restaurez uniquement vos sauvegardes ou celles d’une personne de confiance : un dump
        PostgreSQL contient des instructions exécutables. La restauration remplace toute la
        bibliothèque ; elle ne fusionne pas les collections. Une sauvegarde de sécurité est créée
        avant remplacement.
      </p>
      <p className="field-hint">
        Les préférences d’affichage propres au navigateur ne sont pas incluses. Gardez une seule
        instance de Luden ouverte et arrêtez les scripts de maintenance pendant ces opérations.
      </p>
      {preview && (
        <div className="backup-preview">
          <p>
            Sauvegarde du {new Date(preview.createdAt).toLocaleString('fr-FR')} :{' '}
            <strong>{preview.games} jeux</strong> et <strong>{preview.images} images</strong>.
            Confirmation valable trente minutes.
          </p>
          <Confirm
            title="Remplacer toute la bibliothèque ?"
            description="Les fiches, collections et images actuelles seront remplacées par cette sauvegarde de confiance. Une copie de sécurité sera conservée avant remplacement. Vos identifiants locaux resteront ceux de cette installation."
            confirmLabel="Remplacer et restaurer"
            onConfirm={() => void restore()}
          >
            <button className="button danger" disabled={busy}>
              Confirmer la restauration complète
            </button>
          </Confirm>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              void fetch('/api/restore', {
                method: 'DELETE',
                headers: { 'x-luden-restore-id': preview.id },
              })
              setPreview(null)
              setMessage('Restauration annulée.')
            }}
          >
            Annuler
          </button>
        </div>
      )}
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  )
}
