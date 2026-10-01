import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  galleryKeyboardNeighbor,
  stepGalleryColumns,
  verticalGameNeighbor,
} from '../src/lib/gallery-navigation'

test('Sans sidebar, le clavier suit les jeux visibles sans boucle et retrouve une cible après filtrage', () => {
  const cards = [
    { id: 'a', top: 0, centerX: 50 },
    { id: 'b', top: 0, centerX: 150 },
    { id: 'c', top: 120, centerX: 50 },
  ]
  assert.equal(galleryKeyboardNeighbor(cards, undefined, 'ArrowRight'), 'a')
  assert.equal(galleryKeyboardNeighbor(cards, 'jeu-filtré', 'ArrowDown'), 'a')
  assert.equal(galleryKeyboardNeighbor(cards, 'a', 'ArrowRight'), 'b')
  assert.equal(galleryKeyboardNeighbor(cards, 'b', 'ArrowLeft'), 'a')
  assert.equal(galleryKeyboardNeighbor(cards, 'b', 'ArrowDown'), 'c')
  assert.equal(galleryKeyboardNeighbor(cards, 'c', 'ArrowUp'), 'a')
  assert.equal(galleryKeyboardNeighbor(cards, 'a', 'ArrowLeft'), undefined)
  assert.equal(galleryKeyboardNeighbor(cards, 'c', 'ArrowRight'), undefined)
  assert.equal(galleryKeyboardNeighbor([], undefined, 'ArrowRight'), undefined)
  assert.equal(galleryKeyboardNeighbor(cards, 'a', 'Enter'), undefined)
})

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
