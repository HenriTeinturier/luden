import { db } from './db'
import { importImageUrl } from './media'
import type { ImageInput } from '../lib/media'

type IgdbGame = {
  id: number
  name: string
  summary?: string
  first_release_date?: number
  cover?: { image_id: string }
  platforms?: { id: number; name: string }[]
  genres?: { name: string }[]
  involved_companies?: { developer: boolean; publisher: boolean; company: { name: string } }[]
  release_dates?: { platform: number; y?: number; human?: string; date?: number }[]
  screenshots?: { image_id: string }[]
  artworks?: { image_id: string }[]
  game_localizations?: { name?: string; cover?: { image_id: string } }[]
}
let token: { value: string; expires: number } | undefined
let nextRequest = 0
async function request<T>(endpoint: string, body: string): Promise<T> {
  const clientId = process.env.IGDB_CLIENT_ID
  const secret = process.env.IGDB_CLIENT_SECRET
  if (!clientId || !secret)
    throw new Error(
      'Renseigne IGDB_CLIENT_ID et IGDB_CLIENT_SECRET dans .env puis redémarre Luden. L’ajout manuel reste disponible.',
    )
  // Réserver un créneau avant l'attente limite également les requêtes concurrentes.
  const wait = Math.max(0, nextRequest - Date.now())
  if (wait > 3000)
    throw new Error('Trop de recherches simultanées. Réessaie dans quelques secondes.')
  nextRequest = Date.now() + wait + 300
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait))
  if (!token || token.expires < Date.now()) {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: secret,
        grant_type: 'client_credentials',
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('Connexion IGDB refusée. Vérifie tes identifiants.')
    const data = (await response.json()) as { access_token: string; expires_in: number }
    token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 }
  }
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token.value}`,
      'Content-Type': 'text/plain',
    },
    body,
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) {
    if (response.status === 401) token = undefined
    throw new Error('IGDB est momentanément indisponible. Tes données locales restent accessibles.')
  }
  return response.json() as Promise<T>
}

export async function searchGames(query: string, platformId?: string) {
  const platform = platformId ? await db.platform.findUnique({ where: { id: platformId } }) : null
  const safeQuery = query.replace(/["\\\r\n]/g, ' ').trim()
  const games = await request<IgdbGame[]>(
    'games',
    `search "${safeQuery}"; fields name,summary,first_release_date,cover.image_id,platforms.name,genres.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,release_dates.platform,release_dates.y,release_dates.human,release_dates.date; ${platform?.igdbId ? `where platforms = (${platform.igdbId});` : ''} limit 12;`,
  )
  const platforms = await db.platform.findMany({ select: { id: true, igdbId: true } })
  return games.map((game) => {
    const dates = (game.release_dates ?? [])
      .filter((d) => !platform?.igdbId || d.platform === platform.igdbId)
      .sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity))
    const possible = platforms.filter((p) => game.platforms?.some((gp) => gp.id === p.igdbId))
    return {
      igdbId: game.id,
      title: game.name,
      summary: game.summary ?? '',
      releaseYear:
        dates[0]?.y ??
        (!platform && game.first_release_date
          ? new Date(game.first_release_date * 1000).getUTCFullYear()
          : null),
      releaseDate: dates[0]?.human ?? null,
      suggestedPlatformId:
        platform?.id ??
        (game.platforms?.length === 1 && possible.length === 1 ? possible[0].id : null),
      releases: game.release_dates ?? [],
      developer:
        game.involved_companies
          ?.filter((c) => c.developer)
          .map((c) => c.company.name)
          .join(', ') ?? '',
      publisher:
        game.involved_companies
          ?.filter((c) => c.publisher)
          .map((c) => c.company.name)
          .join(', ') ?? '',
      genres: game.genres?.map((g) => g.name) ?? [],
      platforms: game.platforms ?? [],
      coverUrl: game.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : null,
    }
  })
}

export async function gameImages(id: number) {
  const games = await request<IgdbGame[]>(
    'games',
    `fields cover.image_id,screenshots.image_id,artworks.image_id,game_localizations.name,game_localizations.cover.image_id; where id = ${id}; limit 1;`,
  )
  const game = games[0]
  if (!game) throw new Error('Fiche IGDB introuvable.')
  const images: {
    imageId: string
    category: ImageInput['category']
    title: string
    previewUrl: string
  }[] = []
  function add(imageId: string | undefined, category: ImageInput['category'], title: string) {
    if (!imageId || !/^[a-zA-Z0-9_-]+$/.test(imageId) || images.some((i) => i.imageId === imageId))
      return
    images.push({
      imageId,
      category,
      title,
      previewUrl: `https://images.igdb.com/igdb/image/upload/t_720p/${imageId}.jpg`,
    })
  }
  add(game.cover?.image_id, 'COVER', 'Jaquette principale IGDB')
  game.game_localizations?.forEach((l) =>
    add(l.cover?.image_id, 'COVER', l.name || 'Jaquette régionale'),
  )
  game.screenshots?.forEach((s, i) => add(s.image_id, 'SCREENSHOT', `Capture ${i + 1}`))
  game.artworks?.forEach((s, i) => add(s.image_id, 'OTHER', `Illustration ${i + 1}`))
  return images
}

export async function importGameImage(id: number, imageId: string) {
  const images = await gameImages(id)
  if (!images.some((i) => i.imageId === imageId))
    throw new Error('Cette image ne fait pas partie de la fiche IGDB.')
  return importImageUrl(
    `https://images.igdb.com/igdb/image/upload/t_original/${imageId}.jpg`,
    'IGDB',
  )
}

export async function importCover(id: number) {
  const image = (await gameImages(id)).find((i) => i.category === 'COVER')
  if (!image) throw new Error('Pas de jaquette disponible pour cette fiche IGDB.')
  return importImageUrl(
    `https://images.igdb.com/igdb/image/upload/t_original/${image.imageId}.jpg`,
    'IGDB',
  )
}
