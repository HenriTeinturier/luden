import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { readImage } from '../server/media'
import { parseImageWidth } from '../lib/image-variants'
import { withLibraryAccess } from '../server/maintenance'
export const Route = createFileRoute('/media/$mediaId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          assertLocalRequest(request)
          let width
          try {
            width = parseImageWidth(new URL(request.url).searchParams.get('w'))
          } catch {
            return new Response('Taille de miniature invalide.', { status: 400 })
          }
          const image = await withLibraryAccess(() => readImage(params.mediaId, width))
          if (!image) return new Response('Image indisponible', { status: 404 })
          return new Response(new Uint8Array(image.bytes), {
            headers: {
              'Content-Type': image.mimeType,
              'Cache-Control': image.fallback ? 'private, no-store' : 'private, max-age=86400',
              'X-Content-Type-Options': 'nosniff',
            },
          })
        } catch {
          return new Response('Image indisponible', { status: 404 })
        }
      },
    },
  },
})
