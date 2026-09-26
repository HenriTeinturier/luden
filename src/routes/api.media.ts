import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { MAX_IMAGE_BYTES, saveImage } from '../server/media'
export const Route = createFileRoute('/api/media')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertLocalRequest(request)
          // Limiter le corps effectivement reçu, y compris en transfert sans Content-Length.
          if (Number(request.headers.get('content-length')) > MAX_IMAGE_BYTES + 65536)
            return Response.json({ error: '12 Mo maximum par image.' }, { status: 413 })
          if (!request.body) return Response.json({ error: 'Image manquante.' }, { status: 400 })
          const reader = request.body.getReader()
          const chunks: Uint8Array[] = []
          let size = 0
          try {
            while (true) {
              const chunk = await reader.read()
              if (chunk.done) break
              size += chunk.value.length
              if (size > MAX_IMAGE_BYTES + 65536)
                return Response.json({ error: '12 Mo maximum par image.' }, { status: 413 })
              chunks.push(chunk.value)
            }
          } finally {
            await reader.cancel()
          }
          const parsed = new Response(Buffer.concat(chunks), {
            headers: { 'content-type': request.headers.get('content-type') ?? '' },
          })
          const form = await parsed.formData()
          const file = form.get('image')
          if (!(file instanceof File))
            return Response.json({ error: 'Choisissez une image.' }, { status: 400 })
          if (
            !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(
              file.type,
            )
          )
            return Response.json({ error: 'Format d’image non accepté.' }, { status: 400 })
          return Response.json(await saveImage(Buffer.from(await file.arrayBuffer())))
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error && !('code' in error)
                  ? error.message
                  : 'Impossible de conserver cette image. Vérifiez le dossier de médias.',
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
