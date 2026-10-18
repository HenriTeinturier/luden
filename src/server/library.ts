import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import {
  assertRealCollection,
  collectionSchema,
  gameSchema,
  quickGameSchema,
} from '../lib/validation'
import { retainVisuals } from '../lib/game-visuals'
import { removeUnusedImages } from './media'
import { organizeGameImages } from './media-organization'
import { customizePlatform } from '../lib/platform-customization'

export async function loadLibrary() {
  const [profile, platforms, machines, games, collections, categories, platformVisuals] =
    await Promise.all([
      db.profile.findUniqueOrThrow({ where: { id: ownerId }, select: { name: true } }),
      db.platform.findMany({ orderBy: { name: 'asc' } }),
      db.machine.findMany({ where: { ownerId }, orderBy: { name: 'asc' } }),
      db.game.findMany({
        where: { ownerId },
        orderBy: { updatedAt: 'desc' },
        include: {
          platform: true,
          machine: true,
          cover: { select: { id: true, width: true, height: true } },
          experience: true,
          possessions: true,
          media: {
            orderBy: { position: 'asc' },
            include: { media: { select: { width: true, height: true, source: true } } },
          },
          links: { orderBy: { position: 'asc' } },
          entries: { select: { collectionId: true } },
        },
      }),
      db.collection.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { entries: true } } },
      }),
      db.gameCategory.findMany({
        where: { ownerId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      }),
      db.platformVisual.findMany({
        where: { ownerId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          platformId: true,
          kind: true,
          caption: true,
          active: true,
          isDefault: true,
          position: true,
          width: true,
          height: true,
        },
      }),
    ])
  return {
    profile,
    platforms: platforms.map(customizePlatform),
    platformVisuals: platformVisuals.map((v) => ({ ...v, url: `/platform-media/${v.id}` })),
    machines,
    categories,
    games: games.map((g) => ({
      ...g,
      platform: customizePlatform(g.platform),
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      coverUrl: g.coverId ? `/media/${g.coverId}` : null,
    })),
    collections: collections.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    config: {
      mediaConfigured: Boolean(process.env.LUDEN_DATA_DIR?.trim()),
      igdbConfigured: Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET),
    },
  }
}

export async function saveGame(input: unknown) {
  const data = gameSchema.parse(input)
  const { id, experience, possessions, collectionIds, media, links, presentation, ...fields } = data
  const unused: string[] = []
  const result = await db.$transaction(async (tx) => {
    const existing = id
      ? await tx.game.findFirstOrThrow({
          where: { id, ownerId },
          include: { media: true, possessions: { include: { media: true } } },
        })
      : null
    // Older clients can omit the gallery; never erase it implicitly.
    const images =
      media ??
      existing?.media ??
      (fields.coverId
        ? [
            {
              mediaId: fields.coverId,
              category: 'COVER' as const,
              position: 0,
              caption: '',
              isPrimary: true,
            },
          ]
        : [])
    fields.coverId = images.find((m) => m.isPrimary)?.mediaId ?? null
    const visuals = retainVisuals(
      presentation ?? existing?.presentation,
      images.map((m) => m.mediaId),
    )
    if (
      (await tx.media.count({ where: { id: { in: images.map((m) => m.mediaId) }, ownerId } })) !==
      images.length
    )
      throw new Error('Une image sélectionnée est introuvable.')
    const possessionIds = possessions.flatMap((p) => (p.id ? [p.id] : []))
    if (
      new Set(possessionIds).size !== possessionIds.length ||
      possessionIds.some((pid) => !existing?.possessions.some((p) => p.id === pid))
    )
      throw new Error('Un exemplaire sélectionné est introuvable.')
    unused.push(
      ...(existing?.media.map((m) => m.mediaId) ?? []),
      ...(existing?.possessions
        .filter((p) => !possessionIds.includes(p.id))
        .flatMap((p) => p.media.map((m) => m.mediaId)) ?? []),
    )
    await tx.platform.findUniqueOrThrow({ where: { id: fields.platformId } })
    if (fields.categoryId)
      await tx.gameCategory.findFirstOrThrow({ where: { id: fields.categoryId, ownerId } })
    if (fields.machineId) {
      if (fields.platformId !== 'pc')
        throw new Error('Un PC personnel ne peut être associé qu’à la plateforme PC.')
      await tx.machine.findFirstOrThrow({ where: { id: fields.machineId, ownerId } })
    }
    if (fields.coverId) await tx.media.findFirstOrThrow({ where: { id: fields.coverId, ownerId } })
    const selected = await tx.collection.findMany({ where: { id: { in: collectionIds }, ownerId } })
    if (selected.length !== new Set(collectionIds).size)
      throw new Error('Une collection sélectionnée est introuvable.')
    assertRealCollection(
      possessions,
      selected.some((c) => c.kind === 'REAL'),
    )
    if (id) {
      await tx.possession.deleteMany({ where: { gameId: id, id: { notIn: possessionIds } } })
      for (const p of possessions.filter((p) => p.id)) {
        const { id: possessionId, ...values } = p
        await tx.possession.update({ where: { id: possessionId! }, data: values })
      }
      await tx.collectionEntry.deleteMany({ where: { gameId: id } })
      await tx.mediaAttachment.deleteMany({ where: { gameId: id } })
      if (links) await tx.gameLink.deleteMany({ where: { gameId: id } })
      return tx.game.update({
        where: { id },
        data: {
          ...fields,
          presentation: visuals,
          experience: { upsert: { create: experience, update: experience } },
          possessions: { create: possessions.filter((p) => !p.id) },
          media: {
            create: images.map(({ mediaId, category, position, caption, isPrimary }) => ({
              mediaId,
              category,
              position,
              caption,
              isPrimary,
            })),
          },
          ...(links ? { links: { create: links } } : {}),
          entries: {
            create: [...new Set(collectionIds)].map((collectionId) => ({ collectionId })),
          },
        },
        select: { id: true },
      })
    }
    return tx.game.create({
      data: {
        ...fields,
        presentation: visuals,
        ownerId,
        experience: { create: experience },
        possessions: { create: possessions },
        media: { create: images },
        links: { create: links ?? [] },
        entries: { create: [...new Set(collectionIds)].map((collectionId) => ({ collectionId })) },
      },
      select: { id: true },
    })
  })
  // The game is already saved: a disk error must not invite a duplicate creation on retry.
  // Copy-first organization leaves the previous DB path readable when it fails.
  let mediaWarning: string | null = null
  try {
    await removeUnusedImages(unused)
    await organizeGameImages(result.id)
  } catch (error) {
    console.warn('Rangement des médias différé pour le jeu.', result.id, error)
    mediaWarning =
      'Le rangement des images n’a pas pu être terminé. Elles restent conservées ; vérifiez l’accès au dossier de données puis enregistrez à nouveau la fiche.'
  }
  return { ...result, mediaWarning }
}

export async function quickUpdateGame(input: unknown) {
  const { id, status, rating, memory, owned, ...fields } = quickGameSchema.parse(input)
  return db.$transaction(async (tx) => {
    await tx.game.findFirstOrThrow({ where: { id, ownerId } })
    // Updating the parent first also serializes quick ownership changes for this game.
    const result = await tx.game.update({
      where: { id },
      data: {
        ...fields,
        ...(owned !== undefined ? { updatedAt: new Date() } : {}),
        ...(status !== undefined || rating !== undefined || memory !== undefined
          ? {
              experience: {
                upsert: {
                  create: { status: status ?? 'UNPLAYED', rating, memory },
                  update: {
                    ...(status !== undefined ? { status } : {}),
                    ...(rating !== undefined ? { rating } : {}),
                    ...(memory !== undefined ? { memory } : {}),
                  },
                },
              },
            }
          : {}),
      },
      select: { id: true },
    })
    if (owned === false) {
      await tx.possession.updateMany({
        where: { gameId: id, state: 'CURRENT' },
        data: { state: 'PAST' },
      })
    } else if (owned === true) {
      const current = await tx.possession.findFirst({ where: { gameId: id, state: 'CURRENT' } })
      if (!current) {
        const previous = await tx.possession.findFirst({
          where: { gameId: id, state: 'PAST' },
          orderBy: { id: 'asc' },
        })
        if (previous) {
          await tx.possession.update({ where: { id: previous.id }, data: { state: 'CURRENT' } })
        } else {
          await tx.possession.create({
            data: { gameId: id, format: 'PHYSICAL', state: 'CURRENT' },
          })
        }
      }
    }
    return result
  })
}

export async function deleteGame(id: string) {
  const game = await db.game.findFirst({
    where: { id, ownerId },
    include: { media: true, possessions: { include: { media: true } } },
  })
  await db.game.deleteMany({ where: { id, ownerId } })
  let cleaned = true
  if (game) {
    try {
      cleaned = await removeUnusedImages([
        ...game.media.map((m) => m.mediaId),
        ...game.possessions.flatMap((p) => p.media.map((m) => m.mediaId)),
        ...(game.coverId ? [game.coverId] : []),
      ])
    } catch {
      cleaned = false
    }
  }
  return {
    mediaWarning: cleaned
      ? null
      : 'Le jeu a été supprimé, mais le nettoyage de ses images ou miniatures n’a pas pu être terminé. Vérifiez l’accès au dossier de données.',
  }
}

export async function saveCollection(input: unknown) {
  const { id, ...data } = collectionSchema.parse(input)
  if (id) {
    await db.collection.findFirstOrThrow({ where: { id, ownerId } })
    if (data.kind === 'REAL') {
      const invalid = await db.collectionEntry.count({
        where: { collectionId: id, game: { possessions: { none: {} } } },
      })
      if (invalid)
        throw new Error(
          'Certains jeux n’ont aucune possession. Complète-les avant de convertir cette collection.',
        )
    }
    return db.collection.update({ where: { id }, data, select: { id: true } })
  }
  return db.collection.create({ data: { ...data, ownerId }, select: { id: true } })
}

export async function deleteCollection(id: string) {
  await db.collection.deleteMany({ where: { id, ownerId } })
}

export async function exportLibrary() {
  const [profile, games, machines, collections, media, categories, platformVisuals, platforms] =
    await Promise.all([
      db.profile.findUnique({ where: { id: ownerId } }),
      db.game.findMany({
        where: { ownerId },
        include: {
          platform: true,
          experience: true,
          possessions: { include: { media: true } },
          media: true,
          links: true,
        },
      }),
      db.machine.findMany({ where: { ownerId } }),
      db.collection.findMany({ where: { ownerId }, include: { entries: true } }),
      db.media.findMany({ where: { ownerId } }),
      db.gameCategory.findMany({ where: { ownerId }, orderBy: { position: 'asc' } }),
      db.platformVisual.findMany({ where: { ownerId }, orderBy: { position: 'asc' } }),
      db.platform.findMany({ orderBy: { id: 'asc' } }),
    ])
  return {
    format: 'luden',
    version: 7,
    exportedAt: new Date().toISOString(),
    profile,
    games,
    machines,
    collections,
    media,
    categories,
    platformVisuals,
    platforms,
  }
}
