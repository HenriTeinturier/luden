import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { withLibraryAccess } from './maintenance'

export function assertLocalRequest(request = getRequest()) {
  const url = new URL(request.url)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Cette V1 est réservée à une utilisation locale.')
  const origin = request.headers.get('origin')
  if (origin && origin !== url.origin) throw new Error('Origine de requête non autorisée.')
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    throw new Error('Requête externe refusée.')
}

export async function mutation<T>(action: () => Promise<T>) {
  assertLocalRequest()
  try {
    return { ok: true as const, data: await withLibraryAccess(action) }
  } catch (error) {
    if (error instanceof z.ZodError)
      return { ok: false as const, error: error.issues[0]?.message ?? 'Vérifie les champs.' }
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002')
      return { ok: false as const, error: 'Cet élément existe déjà.' }
    if (prismaError.code === 'P2025')
      return { ok: false as const, error: 'Cet élément est introuvable. Actualise la page.' }
    if (prismaError.code?.startsWith('P'))
      return {
        ok: false as const,
        error: 'La base est indisponible ou cette opération est impossible.',
      }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'L’opération a échoué.',
    }
  }
}
