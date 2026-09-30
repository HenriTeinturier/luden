import { copyFile, mkdir, open, readFile, rename, rmdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { resolveMediaPath } from './media-path'

export function storageSlug(value: string, limit = 48) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, limit)
    .replace(/-+$/g, '')
  return !slug || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(slug)
    ? `jeu-${slug || 'sans-titre'}`
    : slug
}

export function gameMediaPath(
  game: { id: string; title: string; platformId: string },
  mediaId: string,
  category: string,
) {
  // IDs are kept in full: two editions with identical titles never share a directory.
  for (const id of [game.id, mediaId])
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Identifiant média invalide.')
  const labels: Record<string, string> = {
    COVER: 'jaquette',
    SCREENSHOT: 'capture',
    BOX: 'boite',
    MEDIA: 'support',
    DOCUMENT: 'document',
    ADVERTISEMENT: 'publicite',
    OTHER: 'image',
  }
  return `jeux/${storageSlug(game.platformId)}/${storageSlug(game.title)}--${game.id}/${labels[category] ?? 'image'}-${mediaId}.webp`
}

export async function imageHash(file: string) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex')
}

export type MediaMove = { id: string | null; from: string; to: string; sha256: string }

// Copy -> verify -> commit DB path -> remove old copy. A retry accepts an identical destination.
// Callers serialize moves and deletions with withMediaStorageLock.
export async function relocateImage(root: string, move: MediaMove, commit: () => Promise<void>) {
  const from = resolveMediaPath(root, move.from)
  const to = resolveMediaPath(root, move.to)
  if (from === to) return
  let sourceExists = true
  try {
    if ((await imageHash(from)) !== move.sha256)
      throw new Error(`Image source modifiée : ${move.from}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    sourceExists = false
  }
  await mkdir(path.dirname(to), { recursive: true })
  let destinationExists = true
  try {
    await imageHash(to)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    destinationExists = false
  }
  if (sourceExists && !destinationExists) {
    // A crash during copying only leaves a disposable .pending file. The final name
    // becomes visible atomically, after verification, while the storage lock is held.
    const pending = `${to}.pending`
    await copyFile(from, pending)
    if ((await imageHash(pending)) !== move.sha256) throw new Error(`Copie incomplète : ${move.to}`)
    await rename(pending, to)
  }
  if ((await imageHash(to)) !== move.sha256) throw new Error(`Copie différente : ${move.to}`)
  await commit()
  if (sourceExists) await unlink(from)
  await pruneEmptyMediaDirectories(root, path.dirname(from))
}

export async function pruneEmptyMediaDirectories(root: string, directory: string) {
  const boundary = path.resolve(root, 'media')
  let current = path.resolve(directory)
  // rmdir only removes empty directories, never recursively or outside the media root.
  while (current !== boundary) {
    const relative = path.relative(boundary, current)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return
    try {
      await rmdir(current)
    } catch {
      return
    }
    current = path.dirname(current)
  }
}

// Also shared by the maintenance CLI. The lock survives a crash; only a dead local PID is reclaimed.
export async function withMediaStorageLock<T>(root: string, action: () => Promise<T>): Promise<T> {
  const lockPath = resolveMediaPath(root, '.organisation.lock')
  await mkdir(path.dirname(lockPath), { recursive: true })
  const deadline = Date.now() + 30_000
  let handle
  while (!handle) {
    try {
      handle = await open(lockPath, 'wx')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const pid = Number(await readFile(lockPath, 'utf8').catch(() => ''))
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0)
        } catch (probeError) {
          if ((probeError as NodeJS.ErrnoException).code === 'ESRCH') {
            await unlink(lockPath).catch(() => undefined)
            continue
          }
        }
      }
      if (Date.now() >= deadline) throw new Error('Un rangement des médias est déjà en cours.')
      await delay(100)
    }
  }
  try {
    await handle.writeFile(String(process.pid))
    return await action()
  } finally {
    await handle.close()
    await unlink(lockPath)
  }
}
