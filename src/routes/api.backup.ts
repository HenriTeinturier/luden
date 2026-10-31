import { createFileRoute } from '@tanstack/react-router'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { assertLocalRequest } from '../server/request'
import { backupFile, createBackup } from '../server/backup'

export const Route = createFileRoute('/api/backup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertLocalRequest(request)
          return Response.json(await createBackup(), { headers: { 'Cache-Control': 'no-store' } })
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : 'Sauvegarde impossible.' },
            { status: 400 },
          )
        }
      },
      GET: async ({ request }) => {
        try {
          assertLocalRequest(request)
          const file = backupFile(new URL(request.url).searchParams.get('id') || '')
          const info = await stat(file)
          return new Response(
            Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
            {
              headers: {
                'Content-Type': 'application/gzip',
                'Content-Length': String(info.size),
                'Content-Disposition': `attachment; filename="luden-${new Date().toISOString().slice(0, 10)}.luden.tar.gz"`,
                'Cache-Control': 'no-store',
                'X-Content-Type-Options': 'nosniff',
              },
            },
          )
        } catch {
          return Response.json({ error: 'Sauvegarde introuvable.' }, { status: 404 })
        }
      },
    },
  },
})
