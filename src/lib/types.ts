import type { loadLibrary } from '../server/library'
export type Library = Awaited<ReturnType<typeof loadLibrary>>
export type Game = Library['games'][number]
export type Platform = Library['platforms'][number]
export type Collection = Library['collections'][number]
