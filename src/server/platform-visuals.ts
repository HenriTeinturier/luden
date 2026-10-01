import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import { prepareImage } from './media'
import { resolveMediaPath } from './media-path'
import {
  platformIdSchema,
  platformVisualKind,
  platformVisualsSchema,
  deletePlatformVisualSchema,
} from '../lib/platform-visuals'

export async function savePlatformImage(
  platform: unknown,
  kindInput: unknown,
  bytes: Buffer,
  caption: string,
) {
  const platformId = platformIdSchema.parse(platform)
  const kind = platformVisualKind.parse(kindInput)
  await db.platform.findUniqueOrThrow({ where: { id: platformId } })
  const relative = `plateformes/${platformId}/${kind === 'BANNER' ? 'bandeaux' : 'affiches'}/${randomUUID()}.webp`
  const absolute = resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', relative)
  const result = await prepareImage(bytes)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, result.data, { flag: 'wx' })
  try {
    const visual = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Platform" WHERE "id" = ${platformId} FOR UPDATE`
      const count = await tx.platformVisual.count({ where: { platformId, ownerId } })
      if (count >= 100) throw new Error('100 visuels maximum par plateforme.')
      return tx.platformVisual.create({
        data: {
          platformId,
          ownerId,
          kind,
          path: relative,
          width: result.info.width,
          height: result.info.height,
          caption: caption.trim().slice(0, 120),
          position: count,
        },
      })
    })
    return {
      id: visual.id,
      kind,
      caption: visual.caption,
      active: visual.active,
      isDefault: visual.isDefault,
      position: visual.position,
      width: visual.width,
      height: visual.height,
      url: `/platform-media/${visual.id}`,
    }
  } catch (error) {
    await unlink(absolute).catch(() => undefined)
    throw error
  }
}

export async function savePlatformVisuals(input: unknown) {
  const { platformId, visuals, slideshow } = platformVisualsSchema.parse(input)
  await db.$transaction(async (tx) => {
    await tx.platform.findUniqueOrThrow({ where: { id: platformId } })
    await tx.$queryRaw`SELECT "id" FROM "Platform" WHERE "id" = ${platformId} FOR UPDATE`
    if (slideshow)
      await tx.platform.update({
        where: { id: platformId },
        data: { slideshowEnabled: slideshow.enabled, slideshowSeconds: slideshow.seconds },
      })
    const stored = await tx.platformVisual.findMany({ where: { ownerId, platformId } })
    if (
      stored.length !== visuals.length ||
      visuals.some((v) => !stored.some((s) => s.id === v.id && s.kind === v.kind))
    )
      throw new Error('Les visuels ont changé. Actualisez le formulaire avant d’enregistrer.')
    // Clear defaults first so the unique index also protects concurrent requests.
    await tx.platformVisual.updateMany({
      where: { ownerId, platformId },
      data: { isDefault: false },
    })
    for (const [position, visual] of visuals.entries()) {
      await tx.platformVisual.update({
        where: { id: visual.id },
        data: {
          caption: visual.caption,
          active: visual.active,
          isDefault: visual.isDefault,
          position,
        },
      })
    }
  })
  return { platformId }
}

export async function readPlatformImage(id: string) {
  const visual = await db.platformVisual.findFirst({ where: { id, ownerId } })
  if (!visual) return null
  return readFile(resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', visual.path))
}

export async function deletePlatformVisual(input: unknown) {
  const { platformId, id } = deletePlatformVisualSchema.parse(input)
  const absolute = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Platform" WHERE "id" = ${platformId} FOR UPDATE`
    const visual = await tx.platformVisual.findFirstOrThrow({ where: { id, platformId, ownerId } })
    const file = resolveMediaPath(process.env.LUDEN_DATA_DIR ?? '', visual.path)
    await tx.platformVisual.delete({ where: { id } })
    if (visual.isDefault) {
      const next = await tx.platformVisual.findFirst({
        where: { platformId, ownerId, kind: visual.kind, active: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      })
      if (next)
        await tx.platformVisual.update({ where: { id: next.id }, data: { isDefault: true } })
    }
    return file
  })
  // The DB commit comes first: a failed transaction must never lose its file.
  try {
    await unlink(absolute)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      return {
        id,
        warning:
          'Image retirée de la plateforme, mais son fichier n’a pas pu être supprimé du disque.',
      }
  }
  return { id, warning: null }
}
