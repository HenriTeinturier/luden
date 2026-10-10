import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { imageWidths, type ImageWidth } from '../lib/image-variants'
import { resolveMediaPath } from './media-path'

const pending = new Map<string, Promise<Buffer>>()
const waiting: Array<() => void> = []
let generating = 0

// Capture the revision before removing the original, then drain conversions so they
// cannot recreate its cache after deletion. Only known files in hash directories are removed.
export async function removeStoredImage(root: string, relative: string) {
  const source = resolveMediaPath(root, relative)
  const original = await stat(source).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  await unlink(source).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
  })
  if (!original) return
  const revision = `${source}:${original.size}:${original.mtimeMs}`
  for (const value of [revision, `${revision}:${original.ctimeMs}`]) {
    const key = createHash('sha256').update(value).digest('hex')
    const directory = path.resolve(root, 'cache', 'thumbnails', 'v1', key)
    for (const width of imageWidths) {
      const destination = path.join(directory, `${width}.webp`)
      await pending.get(destination)?.catch(() => undefined)
      await unlink(destination).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error
      })
    }
    await rmdir(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}

async function cacheThumbnail(destination: string, bytes: Buffer) {
  await mkdir(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, bytes, { flag: 'wx' })
    await rename(temporary, destination)
  } finally {
    await unlink(temporary).catch(() => undefined)
  }
}

async function generate(action: () => Promise<Buffer>) {
  if (generating >= 2) await new Promise<void>((resolve) => waiting.push(resolve))
  else generating++
  try {
    return await action()
  } finally {
    const next = waiting.shift()
    if (next) next()
    else generating--
  }
}

async function thumbnail(root: string, source: string, width: ImageWidth) {
  const original = await stat(source)
  // ctime changes on metadata-only updates (including OneDrive hydration).
  // Use only content modification time and size to invalidate an unchanged source path.
  const revision = `${source}:${original.size}:${original.mtimeMs}`
  const key = createHash('sha256').update(revision).digest('hex')
  const directory = path.join(root, 'cache', 'thumbnails', 'v1', key)
  const destination = path.join(directory, `${width}.webp`)
  try {
    return await readFile(destination)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  // Reuse the previous cache format when its current revision is still identifiable.
  // Copy only: existing variants and any older running process remain undisturbed.
  const legacyKey = createHash('sha256').update(`${revision}:${original.ctimeMs}`).digest('hex')
  const legacy = path.join(root, 'cache', 'thumbnails', 'v1', legacyKey, `${width}.webp`)
  try {
    const bytes = await readFile(legacy)
    try {
      await cacheThumbnail(destination, bytes)
    } catch {
      // Even a read-only cache can serve a previously generated thumbnail.
    }
    return bytes
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const existing = pending.get(destination)
  if (existing) return null
  const job = generate(async () => {
    // Buffer input avoids libvips retaining a file handle that blocks moves/deletes on Windows.
    const bytes = await sharp(await readFile(source), {
      limitInputPixels: 40_000_000,
      animated: false,
    })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 100 })
      .toBuffer()
    const current = await stat(source)
    if (`${source}:${current.size}:${current.mtimeMs}` !== revision)
      throw new Error('Image modifiée pendant la génération.')
    await cacheThumbnail(destination, bytes)
    return bytes
  }).finally(() => pending.delete(destination))
  pending.set(destination, job)
  // Never make an image response wait for conversion or for the background queue.
  // Failed jobs can be retried by a later request; no unhandled background rejection.
  void job.catch(() => undefined)
  return null
}

// Call only after checking the media owner. Cache hits never bypass that check.
export async function readStoredImage(
  root: string,
  relative: string,
  mimeType: string,
  width?: ImageWidth,
) {
  const source = resolveMediaPath(root, relative)
  if (width !== undefined && !imageWidths.includes(width))
    throw new Error('Taille de miniature invalide.')
  if (width) {
    try {
      const bytes = await thumbnail(root, source, width)
      if (bytes) return { bytes, mimeType: 'image/webp', fallback: false }
    } catch {
      // A full disk, unavailable cache or conversion failure must not hide the user's image.
    }
    return { bytes: await readFile(source), mimeType, fallback: true }
  }
  return { bytes: await readFile(source), mimeType, fallback: false }
}
