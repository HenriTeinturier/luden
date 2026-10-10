import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp, { type Sharp } from 'sharp'
import { mediaImageSources, parseImageWidth } from '../src/lib/image-variants'
import { readStoredImage } from '../src/server/image-variants'

async function readyThumbnail(root: string, relative: string, width: 320 | 640) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const result = await readStoredImage(root, relative, 'image/png', width)
    if (!result.fallback) return result
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('La miniature ne s’est pas créée en arrière-plan.')
}

test('Miniatures : seules les tailles prévues sont acceptées et les petites images restent exactes', () => {
  assert.equal(parseImageWidth(null), undefined)
  for (const width of [320, 640, 1280]) assert.equal(parseImageWidth(String(width)), width)
  for (const value of ['', '0', '-1', '321', '999999', '640.0', '../320'])
    assert.throws(() => parseImageWidth(value))
  assert.equal(
    mediaImageSources('/media/image', 500, '200px').srcSet,
    '/media/image?w=320 320w, /media/image?w=640 500w',
  )
  assert.equal(mediaImageSources('/media/image', 100, '200px').srcSet, '/media/image?w=320 100w')
  assert.deepEqual(mediaImageSources('https://example.com/image.webp', 900, '200px'), {
    src: 'https://example.com/image.webp',
  })
})

test('Miniatures : proportions, transparence, original intact et cache réutilisé après requêtes simultanées', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-thumbnails-'))
  try {
    await mkdir(path.join(root, 'media'))
    const original = await sharp({
      create: {
        width: 800,
        height: 1600,
        channels: 4,
        background: { r: 220, g: 70, b: 30, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer()
    const source = path.join(root, 'media', 'portrait.png')
    await writeFile(source, original)
    await readyThumbnail(root, 'portrait.png', 320)
    const results = await Promise.all(
      Array.from({ length: 8 }, () => readStoredImage(root, 'portrait.png', 'image/png', 320)),
    )
    for (const result of results) {
      assert.equal(result.fallback, false)
      assert.equal(result.mimeType, 'image/webp')
      assert.deepEqual(result.bytes, results[0].bytes)
    }
    const metadata = await sharp(results[0].bytes).metadata()
    assert.equal(metadata.width, 320)
    assert.equal(metadata.height, 640)
    assert.equal(metadata.hasAlpha, true)
    const alpha = (await sharp(results[0].bytes).stats()).channels[3]
    assert.ok(alpha.min >= 127 && alpha.max <= 128)
    const cacheRoot = path.join(root, 'cache', 'thumbnails', 'v1')
    const revisions = await readdir(cacheRoot)
    assert.equal(revisions.length, 1)
    const directory = path.join(cacheRoot, revisions[0])
    assert.deepEqual(await readdir(directory), ['320.webp'])
    const cached = path.join(directory, '320.webp')
    const before = await stat(cached)
    await readStoredImage(root, 'portrait.png', 'image/png', 320)
    assert.equal((await stat(cached)).mtimeMs, before.mtimeMs)
    assert.deepEqual(await readFile(source), original)
    assert.deepEqual((await readStoredImage(root, 'portrait.png', 'image/png')).bytes, original)

    // A replaced image must never reuse the previous revision's thumbnail.
    await writeFile(
      source,
      await sharp({
        create: { width: 200, height: 100, channels: 4, background: '#123456' },
      })
        .png()
        .toBuffer(),
    )
    const changed = await readyThumbnail(root, 'portrait.png', 640)
    assert.equal(changed.fallback, false)
    const small = await sharp(changed.bytes).metadata()
    assert.equal(small.width, 200)
    assert.equal(small.height, 100)
    assert.equal((await readdir(cacheRoot)).length, 2)
    await unlink(source)
    await assert.rejects(readStoredImage(root, 'portrait.png', 'image/png', 640))
  } finally {
    // Only the unique directory created by this test.
    await rm(root, { recursive: true, force: true })
  }
})

test('Miniatures : une conversion bloquée ne bloque aucune réponse image à froid', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-thumbnails-'))
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let requests: Promise<Awaited<ReturnType<typeof readStoredImage>>[]> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await mkdir(path.join(root, 'media'))
    const original = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#345678' },
    })
      .png()
      .toBuffer()
    await writeFile(path.join(root, 'media', 'cold.png'), original)
    const convert = sharp.prototype.toBuffer
    let conversions = 0
    t.mock.method(sharp.prototype, 'toBuffer', async function (this: Sharp) {
      conversions++
      await gate
      return Reflect.apply(convert, this, [])
    })
    requests = Promise.all(
      Array.from({ length: 8 }, () => readStoredImage(root, 'cold.png', 'image/png', 320)),
    )
    const results = await Promise.race([
      requests,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Réponses bloquées par la conversion.')), 2000)
      }),
    ])
    for (const result of results) {
      assert.equal(result.fallback, true)
      assert.equal(result.mimeType, 'image/png')
      assert.deepEqual(result.bytes, original)
    }
    release()
    const cached = await readyThumbnail(root, 'cold.png', 320)
    assert.equal((await sharp(cached.bytes).metadata()).width, 320)
    assert.equal(conversions, 1)
  } finally {
    clearTimeout(timer)
    release()
    await requests
    // Drain the work started by this test before deleting its unique directory.
    await readyThumbnail(root, 'cold.png', 320)
    t.mock.restoreAll()
    await rm(root, { recursive: true, force: true })
  }
})

test('Miniatures : cache indisponible et conversion impossible servent la grande image, chemins bornés', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-thumbnails-'))
  try {
    await mkdir(path.join(root, 'media'))
    const source = await sharp({
      create: { width: 500, height: 300, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer()
    await writeFile(path.join(root, 'media', 'image.png'), source)
    await writeFile(path.join(root, 'cache'), 'Le cache ne peut pas être créé ici.')
    const result = await readStoredImage(root, 'image.png', 'image/png', 320)
    assert.equal(result.fallback, true)
    assert.equal(result.mimeType, 'image/png')
    assert.deepEqual(result.bytes, source)
    await writeFile(path.join(root, 'media', 'invalid.webp'), 'invalid')
    assert.equal((await readStoredImage(root, 'invalid.webp', 'image/webp', 320)).fallback, true)
    await assert.rejects(
      readStoredImage(root, '../outside.webp', 'image/webp', 320),
      /Chemin média/,
    )
    await assert.rejects(readStoredImage(root, 'missing.webp', 'image/webp', 320))
  } finally {
    // Invalidate the sources before removing the blocked cache: background work must abort,
    // even if a conversion finishes while the temporary directory is being cleaned up.
    await unlink(path.join(root, 'media', 'image.png')).catch(() => undefined)
    await unlink(path.join(root, 'media', 'invalid.webp')).catch(() => undefined)
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})
