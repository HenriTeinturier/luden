import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { platforms } from '../src/lib/platforms'
import { defaultCategories } from '../src/lib/categories'

const db = new PrismaClient()
try {
  await db.profile.upsert({
    where: { id: 'local' },
    create: { id: 'local', name: 'Ma vie de joueur' },
    update: {},
  })
  for (const platform of platforms) {
    await db.platform.upsert({ where: { id: platform.id }, create: platform, update: platform })
  }
  if (!(await db.gameCategory.count({ where: { ownerId: 'local' } }))) {
    await db.gameCategory.createMany({
      data: defaultCategories.map((name, position) => ({
        ownerId: 'local',
        name,
        position,
      })),
    })
  }
  for (const collection of [
    {
      id: 'local-real',
      name: 'Ma collection',
      description: 'Les jeux qui font partie de mon histoire.',
      kind: 'REAL' as const,
    },
    {
      id: 'local-dream',
      name: 'La collection rêvée',
      description: 'Une vitrine sans limites. Juste pour le plaisir.',
      kind: 'DREAM' as const,
    },
  ])
    await db.collection.upsert({
      where: { id: collection.id },
      create: { ...collection, ownerId: 'local' },
      update: {},
    })
  console.log(
    'Profil local, plateformes et deux collections vides prêts. Aucun jeu personnel ajouté.',
  )
} finally {
  await db.$disconnect()
}
