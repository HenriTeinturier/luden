import assert from 'node:assert/strict'
import test from 'node:test'
import { createPlatformSchema, metadataPlatformId } from '../src/lib/personal-platforms'
import { customizePlatform } from '../src/lib/platform-customization'
import { matchesPlatformFilter } from '../src/lib/platforms'

test('Une plateforme personnelle peut partager plusieurs catégories et une marque indépendante', () => {
  const platform = customizePlatform({
    id: 'custom-hybrid',
    name: 'Hybride',
    shortName: 'Hybride',
    family: 'Personnel',
    customization: { categories: ['CONSOLE', 'HANDHELD'], family: 'NEC' },
  })
  for (const filter of ['Toutes', 'Consoles', 'Portables', 'NEC'])
    assert.equal(matchesPlatformFilter(platform, filter), true)
  for (const filter of ['Ordinateurs', 'Personnel'])
    assert.equal(matchesPlatformFilter(platform, filter), false)
  assert.equal(platform.catalogFamily, 'Personnel')
})

test('Une création exige une catégorie et une association PC cohérente, avec métadonnées distinctes', () => {
  const data = {
    requestId: '11111111-1111-4111-8111-111111111111',
    name: 'PC 1998',
    categories: ['COMPUTER'],
    catalogPlatformId: 'pc',
    dateLabel: '1998–2002',
  }
  assert.equal(createPlatformSchema.safeParse(data).success, true)
  for (const patch of [
    { categories: [] },
    { categories: ['COMPUTER', 'COMPUTER'] },
    { categories: ['CONSOLE'] },
    { dateLabel: 'hier' },
    { name: '' },
    { requestId: '../bad' },
  ])
    assert.equal(createPlatformSchema.safeParse({ ...data, ...patch }).success, false)
  assert.equal(
    createPlatformSchema.safeParse({
      ...data,
      categories: ['CONSOLE', 'HANDHELD'],
      catalogPlatformId: null,
    }).success,
    true,
  )
  assert.equal(metadataPlatformId({ id: 'custom-pc', catalogPlatformId: 'pc' }), 'pc')
  assert.equal(
    metadataPlatformId({ id: 'custom-console', catalogPlatformId: null }),
    'custom-console',
  )
  assert.equal(metadataPlatformId({ id: 'snes' }), 'snes')
})
