import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { db, LOCAL_PROFILE_ID as ownerId } from '../src/server/db'
import { savePlatformImage, savePlatformVisuals } from '../src/server/platform-visuals'
import { platformIdSchema, platformVisualKind } from '../src/lib/platform-visuals'

// Explicit local import, also usable before the first visit to the editor.
const [platformInput, kindInput, source, caption] = process.argv.slice(2)
try {
  const platformId = platformIdSchema.parse(platformInput)
  const kind = platformVisualKind.parse(kindInput)
  if (!source || !caption)
    throw new Error(
      'Usage : tsx scripts/import-platform-visual.ts <plateforme> <BANNER|POSTER> <fichier> <nom>',
    )
  const added = await savePlatformImage(platformId, kind, await readFile(source), caption)
  const visuals = await db.platformVisual.findMany({
    where: { platformId, ownerId },
    orderBy: { position: 'asc' },
  })
  await savePlatformVisuals({
    platformId,
    visuals: visuals.map((v) => ({
      id: v.id,
      kind: v.kind,
      caption: v.caption,
      active: v.id === added.id || v.active,
      isDefault: v.kind === kind ? v.id === added.id : v.isDefault,
    })),
  })
  const stored = await db.platformVisual.findUniqueOrThrow({ where: { id: added.id } })
  console.log(
    JSON.stringify({
      id: added.id,
      path: stored.path,
      width: stored.width,
      height: stored.height,
      isDefault: stored.isDefault,
    }),
  )
} finally {
  await db.$disconnect()
}
