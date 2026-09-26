import { lookup } from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import ipaddr from 'ipaddr.js'
import { webUrlSchema } from '../lib/media'

const MAX_BYTES = 12 * 1024 * 1024
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export function isPublicAddress(address: string) {
  try {
    return ipaddr.process(address).range() === 'unicast'
  } catch {
    return false
  }
}
export function imageUrl(value: string) {
  const url = new URL(webUrlSchema.parse(value))
  if (url.port && !['80', '443'].includes(url.port))
    throw new Error('Port non autorisé pour une image.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    (ipaddr.isValid(host) && !isPublicAddress(host))
  )
    throw new Error('Utilisez une image sur un site public, pas une adresse locale.')
  return url
}

// Resolve once, then pin the socket to that public IP: redirects and DNS rebinding
// must not turn an image import into a request to the local network.
export async function downloadImage(
  value: string,
  redirects = 0,
  signal = AbortSignal.timeout(20000),
): Promise<Buffer> {
  const url = imageUrl(value)
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = await Promise.race([
    lookup(host, { all: true }),
    new Promise<never>((_, reject) => {
      if (signal.aborted) reject(new Error('Téléchargement trop long.'))
      else
        signal.addEventListener('abort', () => reject(new Error('Téléchargement trop long.')), {
          once: true,
        })
    }),
  ])
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error('Cette adresse ne pointe pas vers un site public.')
  const selected = addresses[0]
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http
    const request = client.get(
      url,
      {
        agent: false,
        signal,
        headers: {
          Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif',
          'User-Agent': 'Luden/0.1',
        },
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [selected])
          else callback(null, selected.address, selected.family)
        },
      },
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
          response.destroy()
          if (redirects >= 3 || !response.headers.location)
            return reject(new Error('Trop de redirections.'))
          try {
            resolve(
              downloadImage(new URL(response.headers.location, url).href, redirects + 1, signal),
            )
          } catch {
            reject(new Error('Redirection invalide.'))
          }
          return
        }
        const mime = response.headers['content-type']?.split(';')[0].trim().toLowerCase()
        if (response.statusCode !== 200 || !mime || !MIME_TYPES.has(mime)) {
          response.destroy()
          reject(
            new Error(
              'Le lien doit pointer directement vers une image JPG, PNG, WebP, GIF ou AVIF.',
            ),
          )
          return
        }
        if (Number(response.headers['content-length']) > MAX_BYTES) {
          response.destroy()
          reject(new Error('Image trop volumineuse : 12 Mo maximum.'))
          return
        }
        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_BYTES) {
            response.destroy()
            reject(new Error('Image trop volumineuse : 12 Mo maximum.'))
          } else chunks.push(chunk)
        })
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', () => reject(new Error('Téléchargement interrompu.')))
      },
    )
    request.on('error', () =>
      reject(new Error('Téléchargement impossible. Vérifiez le lien et l’accès au site.')),
    )
  })
}
