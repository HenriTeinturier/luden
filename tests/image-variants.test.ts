import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp, { type Sharp } from 'sharp'
import { mediaImageSources, parseImageWidth } from '../src/lib/image-variants'
import { readStoredImage, removeStoredImage } from '../src/server/image-variants'

async function readyThumbnail(root: string, relative: string, width: 320 | 640) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const result = await readStoredImage(root, relative, 'image/png', width)
    if (!result.fallback) return result
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('La miniature ne s’est pas créée en arrière-plan.')
}

test('Suppression : original et miniatures retirés, conversions drainées et autres images conservées', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-delete-image-'))
  try {
    await mkdir(path.join(root, 'media'))
    const bytes = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer()
    for (const name of ['deleted.png', 'retained.png'])
      await writeFile(path.join(root, 'media', name), bytes)
    await readyThumbnail(root, 'deleted.png', 320)
    await readyThumbnail(root, 'retained.png', 320)
    // Starts a second size in the background immediately before deletion.
    await readStoredImage(root, 'deleted.png', 'image/png', 640)
    await removeStoredImage(root, 'deleted.png')
    await assert.rejects(readFile(path.join(root, 'media', 'deleted.png')))
    assert.equal((await readStoredImage(root, 'retained.png', 'image/png', 320)).fallback, false)
    assert.equal((await readdir(path.join(root, 'cache', 'thumbnails', 'v1'))).length, 1)
    await removeStoredImage(root, 'deleted.png')
    await assert.rejects(removeStoredImage(root, '../retained.png'), /Chemin média/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

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
    const modifiedAt = new Date('2026-01-01T00:00:00.000Z')
    await utimes(source, modifiedAt, modifiedAt)
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

    // Metadata-only updates must keep the same thumbnail, as with hydrated cloud files.
    const sourceBefore = await stat(source)
    await utimes(source, new Date(), modifiedAt)
    const sourceAfter = await stat(source)
    assert.equal(sourceAfter.mtimeMs, sourceBefore.mtimeMs)
    assert.notEqual(sourceAfter.ctimeMs, sourceBefore.ctimeMs)
    const reused = await readStoredImage(root, 'portrait.png', 'image/png', 320)
    assert.equal(reused.fallback, false)
    assert.deepEqual(reused.bytes, results[0].bytes)
    assert.equal((await stat(cached)).mtimeMs, before.mtimeMs)
    assert.deepEqual(await readdir(cacheRoot), revisions)

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

test('Miniatures : les anciennes variantes identifiables sont reprises sans conversion', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-thumbnails-'))
  try {
    await mkdir(path.join(root, 'media'))
    const original = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#987654' },
    })
      .png()
      .toBuffer()
    const source = path.join(root, 'media', 'legacy.png')
    await writeFile(source, original)
    const info = await stat(source)
    const key = createHash('sha256')
      .update(`${source}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`)
      .digest('hex')
    const legacy = path.join(root, 'cache', 'thumbnails', 'v1', key)
    await mkdir(legacy, { recursive: true })
    const bytes = await sharp(original).resize({ width: 320 }).webp().toBuffer()
    await writeFile(path.join(legacy, '320.webp'), bytes)
    const convert = t.mock.method(sharp.prototype, 'toBuffer', () => {
      throw new Error('Une miniature existante ne doit pas être recalculée.')
    })
    for (let visit = 0; visit < 3; visit++) {
      const image = await readStoredImage(root, 'legacy.png', 'image/png', 320)
      assert.equal(image.fallback, false)
      assert.deepEqual(image.bytes, bytes)
    }
    assert.equal(convert.mock.callCount(), 0)
    assert.equal((await readdir(path.join(root, 'cache', 'thumbnails', 'v1'))).length, 2)
  } finally {
    t.mock.restoreAll()
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
