import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sidebarRatingKind } from '../src/lib/sidebar-rating'
import type { Game } from '../src/lib/types'

test('La sidebar distingue note passée, envie et souvenir sans envie', () => {
  const game = { experience: null, discover: false, souvenir: false } as Game
  assert.equal(sidebarRatingKind(game), 'desire')
  assert.equal(sidebarRatingKind({ ...game, souvenir: true }), 'souvenir')
  assert.equal(sidebarRatingKind({ ...game, souvenir: true, discover: true }), 'desire')
  assert.equal(
    sidebarRatingKind({ ...game, experience: { status: 'UNPLAYED', rating: 4 } } as Game),
    'desire',
  )
  for (const status of ['PLAYED', 'PLAYING', 'FINISHED', 'ABANDONED']) {
    assert.equal(
      sidebarRatingKind({
        ...game,
        souvenir: true,
        discover: true,
        experience: { status },
      } as Game),
      'rating',
    )
  }
})
