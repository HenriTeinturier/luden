import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { exportLibrary } from '../server/library'
import { withLibraryAccess } from '../server/maintenance'
export const Route = createFileRoute('/api/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertLocalRequest(request)
          return new Response(JSON.stringify(await withLibraryAccess(exportLibrary), null, 2), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Disposition': `attachment; filename="luden-${new Date().toISOString().slice(0, 10)}.json"`,
              'Cache-Control': 'no-store',
            },
          })
        } catch {
          return Response.json(
            { error: 'Export indisponible. Vérifiez la connexion à la base.' },
            { status: 503 },
          )
        }
      },
    },
  },
})
