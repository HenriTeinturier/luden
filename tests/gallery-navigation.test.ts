import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stepGalleryColumns, verticalGameNeighbor } from '../src/lib/gallery-navigation'

test('La navigation verticale suit la rangée voisine et la colonne la plus proche', () => {
  const cards = [
    { id: 'a', top: 0, centerX: 50 },
    { id: 'b', top: 0, centerX: 150 },
    { id: 'c', top: 0, centerX: 250 },
    { id: 'd', top: 120, centerX: 50 },
    { id: 'e', top: 120, centerX: 150 },
    // Next category has a larger gap and wider cards.
    { id: 'f', top: 390, centerX: 80 },
    { id: 'g', top: 390, centerX: 240 },
  ]
  assert.equal(verticalGameNeighbor(cards, 'b', 1), 'e')
  assert.equal(verticalGameNeighbor(cards, 'c', 1), 'e')
  assert.equal(verticalGameNeighbor(cards, 'e', -1), 'b')
  assert.equal(verticalGameNeighbor(cards, 'e', 1), 'f')
  assert.equal(verticalGameNeighbor(cards, 'g', -1), 'e')
  assert.equal(verticalGameNeighbor(cards, 'a', -1), undefined)
  assert.equal(verticalGameNeighbor(cards, 'g', 1), undefined)
  assert.equal(verticalGameNeighbor(cards, 'absent', 1), undefined)
})

test('La molette conserve une référence de 4 à 10 colonnes avec ou sans sidebar', () => {
  assert.equal(stepGalleryColumns(7, 0, -120), 6)
  assert.equal(stepGalleryColumns(7, 0, 120), 8)
  assert.equal(stepGalleryColumns(9, 2, 120), 8)
  assert.equal(stepGalleryColumns(6, 2, -120), 4)
  assert.equal(stepGalleryColumns(12, 2, 120), 10)
  assert.equal(stepGalleryColumns(4, 0, -120), 4)
  assert.equal(stepGalleryColumns(10, 0, 120), 10)
})
