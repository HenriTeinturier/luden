import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  galleryPreferenceKey,
  restoreGalleryPreferences,
  saveGalleryPreferences,
} from '../src/lib/gallery-preferences'

test('Préférences distinctes par bibliothèque, URL prioritaire et recherche non mémorisée', () => {
  assert.notEqual(galleryPreferenceKey('/platforms/snes'), galleryPreferenceKey('/platforms/amiga'))
  assert.equal(galleryPreferenceKey('/library/'), galleryPreferenceKey('/library'))
  assert.deepEqual(
    restoreGalleryPreferences(
      JSON.stringify({ group: 'category', sort: 'rating', view: 'list', columns: 6, q: 'ancien' }),
      { sort: 'title', q: 'Mario' },
    ),
    {
      group: 'category',
      sort: 'title',
      view: 'list',
      columns: 6,
      q: 'Mario',
    },
  )
})

test('La densité reste mémorisée, mais un choix automatique explicite reste prioritaire', () => {
  assert.deepEqual(restoreGalleryPreferences('{"columns":6}', { columns: 'auto' }), {
    columns: 'auto',
  })
  assert.deepEqual(restoreGalleryPreferences('{"columns":999,"sort":"rating"}', {}), {
    columns: undefined,
    sort: 'rating',
  })
})

test('Le nombre de colonnes est enregistré et restauré après une nouvelle visite', (t) => {
  const storage = new Map<string, string>()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  })
  for (const columns of [4, 7, 10, 'auto'] as const) {
    saveGalleryPreferences('/platforms/snes', { columns, q: 'Mario' })
    const restored = restoreGalleryPreferences(
      storage.get(galleryPreferenceKey('/platforms/snes'))!,
      {},
    )
    assert.equal(restored.columns, columns)
    assert.equal(restored.q, undefined)
  }
  saveGalleryPreferences('/platforms/amiga', { scope: 'owned', favorite: false, view: 'list' })
  for (const scope of ['played', 'discover', 'owned', 'all'] as const) {
    saveGalleryPreferences('/platforms/snes', { scope, favorite: true, columns: 7 })
    assert.deepEqual(
      restoreGalleryPreferences(storage.get(galleryPreferenceKey('/platforms/snes'))!, {}),
      { scope, favorite: true, columns: 7 },
    )
    assert.deepEqual(
      restoreGalleryPreferences(storage.get(galleryPreferenceKey('/platforms/amiga'))!, {}),
      { scope: 'owned', favorite: false, view: 'list' },
    )
  }
})

test('Stockage absent ou invalide : conserver les choix URL sans imposer de regroupement', () => {
  for (const raw of [null, 'invalid', '{"group":"invalid"}']) {
    assert.deepEqual(restoreGalleryPreferences(raw, { scope: 'played' }), { scope: 'played' })
  }
})

test('Le mélange mémorisé est restauré et la graine du lien reste prioritaire', () => {
  const saved = JSON.stringify({ sort: 'random', randomSeed: 12345 })
  assert.deepEqual(restoreGalleryPreferences(saved, {}), { sort: 'random', randomSeed: 12345 })
  assert.deepEqual(restoreGalleryPreferences(saved, { sort: 'random', randomSeed: 67890 }), {
    sort: 'random',
    randomSeed: 67890,
  })
})

test('La vue À trier se restaure et laisse la priorité aux choix explicites', () => {
  const saved = JSON.stringify({ scope: 'unassigned', owned: 'current' })
  assert.deepEqual(restoreGalleryPreferences(saved, {}), { scope: 'unassigned', owned: 'current' })
  assert.deepEqual(restoreGalleryPreferences(saved, { scope: 'all' }), {
    scope: 'all',
    owned: 'current',
  })
})

test('Le filtre Souvenirs est mémorisé et sa désactivation explicite reste prioritaire', () => {
  const saved = JSON.stringify({ scope: 'all', souvenir: true })
  assert.equal(restoreGalleryPreferences(saved, {}).souvenir, true)
  assert.equal(restoreGalleryPreferences(saved, { souvenir: false }).souvenir, false)
})
