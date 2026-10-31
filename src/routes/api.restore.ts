import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { discardBackup, inspectBackup, restoreBackup } from '../server/backup'
import { withLibraryAccess } from '../server/maintenance'

export const Route = createFileRoute('/api/restore')({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        try {
          assertLocalRequest(request)
          await withLibraryAccess(() =>
            discardBackup(request.headers.get('x-luden-restore-id') || ''),
          )
          return Response.json({ ok: true })
        } catch {
          return Response.json({ error: 'Annulation impossible.' }, { status: 400 })
        }
      },
      POST: async ({ request }) => {
        try {
          assertLocalRequest(request)
          return Response.json(await withLibraryAccess(() => inspectBackup(request)), {
            headers: { 'Cache-Control': 'no-store' },
          })
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : 'Archive non reconnue.' },
            { status: 400 },
          )
        }
      },
      PUT: async ({ request }) => {
        try {
          assertLocalRequest(request)
          // A fixed header keeps this final destructive action small and unambiguous.
          const id = request.headers.get('x-luden-restore-id') || ''
          if (request.headers.get('x-luden-confirm') !== 'replace-trusted-backup')
            throw new Error('Confirmez le remplacement de la bibliothèque.')
          return Response.json(await restoreBackup(id), {
            headers: { 'Cache-Control': 'no-store' },
          })
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : 'Restauration impossible.' },
            { status: 400 },
          )
        }
      },
    },
  },
})
