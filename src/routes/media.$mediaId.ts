import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { readImage } from '../server/media'
export const Route = createFileRoute('/media/$mediaId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          assertLocalRequest(request)
          const image = await readImage(params.mediaId)
          if (!image) return new Response('Image indisponible', { status: 404 })
          return new Response(new Uint8Array(image.bytes), {
            headers: {
              'Content-Type': image.mimeType,
              'Cache-Control': 'private, max-age=86400',
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
