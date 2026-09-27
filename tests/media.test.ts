import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attachmentsSchema, gameLinkSchema, orderImages, type ImageInput } from '../src/lib/media'
import { imageUrl, isPublicAddress } from '../src/server/remote-image'
import { emptyGame, gameSchema } from '../src/lib/validation'

test('Galerie : plusieurs images par catégorie, principale unique et ordre après retrait', () => {
  const items: ImageInput[] = [
    { mediaId: 'one', category: 'COVER', position: 0, caption: '', isPrimary: true },
    { mediaId: 'two', category: 'COVER', position: 1, caption: 'PAL', isPrimary: false },
    { mediaId: 'three', category: 'SCREENSHOT', position: 2, caption: '', isPrimary: false },
  ]
  assert.equal(attachmentsSchema.parse(items).length, 3)
  assert.equal(attachmentsSchema.safeParse([...items, items[0]]).success, false)
  assert.equal(
    attachmentsSchema.safeParse(items.map((i) => ({ ...i, isPrimary: true }))).success,
    false,
  )
  const next = orderImages(items.slice(1))
  assert.equal(next[0].isPrimary, true)
  assert.deepEqual(
    next.map((i) => i.position),
    [0, 1],
  )
  assert.deepEqual(orderImages([]), [])
})

test('Une publicité est acceptée dans la galerie du jeu', () => {
  const media = [
    { mediaId: 'advertisement', category: 'ADVERTISEMENT', position: 0, isPrimary: true },
  ]
  const parsed = gameSchema.parse({
    ...structuredClone(emptyGame),
    title: 'Un jeu',
    platformId: 'amiga',
    media,
  })
  assert.equal(parsed.media?.[0].category, 'ADVERTISEMENT')
})

test('Les liens conservent une URL HTTP(S), sans contenu actif ni identifiants', () => {
  const link = {
    url: 'https://www.youtube.com/watch?v=example',
    title: '',
    type: 'VIDEO',
    position: 0,
  }
  assert.equal(gameLinkSchema.parse(link).url, link.url)
  for (const url of [
    'javascript:alert(1)',
    'file:///C:/secret',
    'data:text/html,test',
    'https://user:password@example.com',
  ])
    assert.equal(gameLinkSchema.safeParse({ ...link, url }).success, false)
})

test('Import distant : blocage des réseaux privés, loopback, IPv4 mappées et protocoles locaux', () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '192.168.1.2',
    '172.16.0.1',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '2001:db8::1',
  ])
    assert.equal(isPublicAddress(address), false, address)
  assert.equal(isPublicAddress('8.8.8.8'), true)
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true)
  for (const url of [
    'http://2130706433/test.png',
    'http://0x7f000001/',
    'http://[::1]/',
    'http://localhost/',
    'https://example.com:5434/',
    'file:///C:/test.png',
  ])
    assert.throws(() => imageUrl(url), url)
})

test('Anciennes fiches et identifiants d’exemplaires restent compatibles avec la validation', () => {
  const base = {
    ...emptyGame,
    title: 'Mario Kart',
    platformId: 'snes',
    media: undefined,
    links: undefined,
    possessions: [{ id: 'copy-pal', format: 'PHYSICAL', state: 'CURRENT', store: '' }],
  }
  const game = gameSchema.parse(base)
  assert.equal(game.media, undefined)
  assert.equal(game.possessions[0].id, 'copy-pal')
  assert.equal(gameSchema.safeParse({ ...base, platformId: '' }).success, false)
})
