import { mkdir, writeFile, unlink } from 'node:fs/promises'
import type { MediaSource } from '@prisma/client'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp, { type OutputInfo } from 'sharp'
import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import { resolveMediaPath } from './media-path'
import { pruneEmptyMediaDirectories, withMediaStorageLock } from './media-storage'
import { readStoredImage, removeStoredImage } from './image-variants'
import type { ImageWidth } from '../lib/image-variants'

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
export async function prepareImage(bytes: Buffer) {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Image trop volumineuse : 12 Mo maximum.')
  let result: { data: Buffer; info: OutputInfo }
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, animated: false })
    const meta = await image.metadata()
    if (!['jpeg', 'png', 'webp', 'avif', 'gif'].includes(meta.format ?? ''))
      throw new Error('format')
    result = await image
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true })
  } catch {
    throw new Error('Image non reconnue. Utilise un fichier JPG, PNG, WebP, GIF ou AVIF valide.')
  }
  return result
}

export async function saveImage(bytes: Buffer, sourceUrl?: string, source: MediaSource = 'UPLOAD') {
  const root = process.env.LUDEN_DATA_DIR?.trim() ?? ''
  const relative = `_imports/${randomUUID()}.webp`
  const absolute = resolveMediaPath(root, relative)
  const result = await prepareImage(bytes)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, result.data, { flag: 'wx' })
  try {
    return await db.media.create({
      data: {
        ownerId,
        path: relative,
        mimeType: 'image/webp',
        width: result.info.width,
        height: result.info.height,
        sourceUrl,
        source,
      },
      select: { id: true },
    })
  } catch (error) {
    await unlink(absolute).catch(() => undefined)
    throw error
  }
}

export async function importImageUrl(url: string, source: MediaSource = 'EXTERNAL_URL') {
  const { downloadImage } = await import('./remote-image')
  // Fail before downloading if the media folder has not been configured.
  resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', '_imports/check.webp')
  return saveImage(await downloadImage(url), url, source)
}

// Only copies no longer referenced by any game or owned copy can be removed.
export async function removeUnusedImages(ids: string[]) {
  if (!ids.length) return true
  const root = process.env.LUDEN_DATA_DIR ?? ''
  if (!root.trim()) return false
  return withMediaStorageLock(root, () => removeUnusedImagesLocked(ids))
}

async function removeUnusedImagesLocked(ids: string[]) {
  let cleaned = true
  for (const id of new Set(ids)) {
    const media = await db.media.findFirst({
      where: { id, ownerId, games: { none: {} }, attachments: { none: {} } },
    })
    if (!media) continue
    try {
      const absolute = resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', media.path)
      const removed = await db.media.deleteMany({
        where: { id, ownerId, games: { none: {} }, attachments: { none: {} } },
      })
      if (removed.count) await removeStoredImage(process.env.LUDEN_DATA_DIR ?? '', media.path)
      if (removed.count)
        await pruneEmptyMediaDirectories(process.env.LUDEN_DATA_DIR ?? '', path.dirname(absolute))
    } catch {
      cleaned = false
      console.warn('Nettoyage du média différé.', id)
    }
  }
  return cleaned
}

export async function readImage(id: string, width?: ImageWidth) {
  const media = await db.media.findFirst({ where: { id, ownerId } })
  if (!media) return null
  try {
    return await readStoredImage(
      process.env.LUDEN_DATA_DIR ?? '',
      media.path,
      media.mimeType,
      width,
    )
  } catch {
    // A reorganization may have committed a new path after the initial query.
    const current = await db.media.findFirst({ where: { id, ownerId } })
    if (!current || current.path === media.path) return null
    try {
      return await readStoredImage(
        process.env.LUDEN_DATA_DIR ?? '',
        current.path,
        current.mimeType,
        width,
      )
    } catch {
      return null
    }
  }
}
