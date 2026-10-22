import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readPlatformCustomization } from '../src/lib/platform-customization'

test('Les anciennes plateformes restent visibles et le masquage conserve les autres réglages', () => {
  assert.equal(readPlatformCustomization({}).hiddenFromPlatforms, false)
  const original = readPlatformCustomization({ dateLabel: '1995', hiddenFromPlatforms: true })
  assert.equal(original.hiddenFromPlatforms, true)
  assert.equal(original.dateLabel, '1995')
  const shown = readPlatformCustomization({ ...original, hiddenFromPlatforms: false })
  assert.equal(shown.hiddenFromPlatforms, false)
  assert.equal(shown.dateLabel, '1995')
})
