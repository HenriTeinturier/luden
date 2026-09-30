import { access, readFile } from 'node:fs/promises'
import { resolveMediaPath } from './media-path'

export function universeSidebarPath(platformId: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(platformId)) throw new Error('Plateforme invalide.')
  return resolveMediaPath(
    process.env.LUDEN_DATA_DIR ?? '',
    `plateformes/${platformId}/sidebar.webp`,
  )
}

export async function universeSidebarImages(platformIds: string[]) {
  const available = await Promise.all(
    platformIds.map(async (id) => {
      try {
        await access(universeSidebarPath(id))
        return [id, `/universe-media/${id}`] as const
      } catch {
        return null
      }
    }),
  )
  return Object.fromEntries(available.filter((entry) => entry !== null))
}

export async function readUniverseSidebar(platformId: string) {
  return readFile(universeSidebarPath(platformId))
}
