import { createFileRoute } from '@tanstack/react-router'
import { assertLocalRequest } from '../server/request'
import { readUniverseSidebar } from '../server/universe-media'

export const Route = createFileRoute('/universe-media/$platformId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          assertLocalRequest(request)
          const bytes = await readUniverseSidebar(params.platformId)
          return new Response(new Uint8Array(bytes), {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'private, max-age=0, must-revalidate',
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
