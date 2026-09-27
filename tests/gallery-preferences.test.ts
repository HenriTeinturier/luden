import { test } from 'node:test'
import assert from 'node:assert/strict'
import { galleryPreferenceKey, restoreGalleryPreferences } from '../src/lib/gallery-preferences'

test('Préférences distinctes par bibliothèque, URL prioritaire et recherche non mémorisée', () => {
  assert.notEqual(galleryPreferenceKey('/platforms/snes'), galleryPreferenceKey('/platforms/amiga'))
  assert.equal(galleryPreferenceKey('/library/'), galleryPreferenceKey('/library'))
  assert.deepEqual(
    restoreGalleryPreferences(
      JSON.stringify({ group: 'category', sort: 'rating', view: 'list', q: 'ancien' }),
      { sort: 'title', q: 'Mario' },
    ),
    {
      group: 'category',
      sort: 'title',
      view: 'list',
      q: 'Mario',
    },
  )
})

test('Stockage absent ou invalide : conserver les choix URL sans imposer de regroupement', () => {
  for (const raw of [null, 'invalid', '{"group":"invalid"}']) {
    assert.deepEqual(restoreGalleryPreferences(raw, { scope: 'played' }), { scope: 'played' })
  }
})
