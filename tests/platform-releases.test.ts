import assert from 'node:assert/strict'
import test from 'node:test'
import { platforms } from '../src/lib/platforms'
import { platformReleases } from '../src/lib/platform-releases'

test('every catalog platform except generic PC has a regional release year', () => {
  assert.equal(platformReleases.pc, undefined)
  assert.deepEqual(
    Object.keys(platformReleases).sort(),
    platforms
      .filter((p) => p.id !== 'pc')
      .map((p) => p.id)
      .sort(),
  )
  for (const release of Object.values(platformReleases)) {
    assert.ok(release && Number.isInteger(release.year))
    assert.ok(release.year >= 1970 && release.year <= new Date().getFullYear())
    assert.ok(['France', 'Europe', 'Japon'].includes(release.region))
  }
})
