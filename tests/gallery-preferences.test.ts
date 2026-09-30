import { test } from 'node:test'
import assert from 'node:assert/strict'
import { galleryPreferenceKey, restoreGalleryPreferences } from '../src/lib/gallery-preferences'

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

test('Stockage absent ou invalide : conserver les choix URL sans imposer de regroupement', () => {
  for (const raw of [null, 'invalid', '{"group":"invalid"}']) {
    assert.deepEqual(restoreGalleryPreferences(raw, { scope: 'played' }), { scope: 'played' })
  }
})
