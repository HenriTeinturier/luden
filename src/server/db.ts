import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const globalDb = globalThis as unknown as { ludenDb?: PrismaClient }
export const db = globalDb.ludenDb ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalDb.ludenDb = db

// V1 locale uniquement. Remplacer par la session authentifiée avant toute exposition réseau.
export const LOCAL_PROFILE_ID = 'local'
