import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { readPlatformImage } from '../server/platform-visuals'
import { withLibraryAccess } from '../server/maintenance'

export const Route = createFileRoute('/platform-media/$visualId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          assertLocalRequest(request)
          const bytes = await withLibraryAccess(() => readPlatformImage(params.visualId))
          if (!bytes) return new Response('Image indisponible', { status: 404 })
          return new Response(new Uint8Array(bytes), {
            headers: {
              'Content-Type': 'image/webp',
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
