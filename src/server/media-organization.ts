import { db, LOCAL_PROFILE_ID as ownerId } from './db'
import {
  gameMediaPath,
  imageHash,
  relocateImage,
  withMediaStorageLock,
  type MediaMove,
} from './media-storage'
import { resolveMediaPath } from './media-path'

const gameSelect = { id: true, title: true, platformId: true } as const

export async function mediaDestinations(gameId?: string) {
  const records = await db.media.findMany({
    where: {
      ownerId,
      ...(gameId
        ? {
            OR: [
              { games: { some: { id: gameId } } },
              { attachments: { some: { OR: [{ gameId }, { possession: { gameId } }] } } },
            ],
          }
        : {}),
    },
    include: {
      games: { select: gameSelect },
      attachments: {
        include: {
          game: { select: gameSelect },
          possession: { select: { game: { select: gameSelect } } },
        },
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  })
  return records.map((media) => {
    const games = new Map(media.games.map((g) => [g.id, g]))
    for (const attachment of media.attachments) {
      const game = attachment.game ?? attachment.possession?.game
      if (game) games.set(game.id, game)
    }
    const game = [...games.values()][0]
    const category =
      media.attachments.find((a) => a.gameId === game?.id)?.category ??
      media.attachments[0]?.category ??
      'COVER'
    const to =
      games.size > 1
        ? `_partages/${media.id}.webp`
        : game
          ? gameMediaPath(game, media.id, category)
          : `_sans-jeu/${media.id}.webp`
    return { id: media.id, from: media.path, to }
  })
}

export async function commitMediaMove(move: MediaMove) {
  if (!move.id) return
  const updated = await db.media.updateMany({
    where: { id: move.id, ownerId, path: { in: [move.from, move.to] } },
    data: { path: move.to },
  })
  if (updated.count !== 1) throw new Error(`Le média a changé pendant le rangement : ${move.id}`)
}

export async function organizeGameImages(gameId: string) {
  const root = process.env.LUDEN_DATA_DIR ?? ''
  const initial = await mediaDestinations(gameId)
  if (!initial.some((m) => m.from !== m.to)) return
  await withMediaStorageLock(root, async () => {
    for (const entry of await mediaDestinations(gameId)) {
      if (entry.from === entry.to) continue
      const move = { ...entry, sha256: await imageHash(resolveMediaPath(root, entry.from)) }
      await relocateImage(root, move, () => commitMediaMove(move))
    }
  })
}
