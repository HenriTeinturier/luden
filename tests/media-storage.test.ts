import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { gameMediaPath, imageHash, relocateImage, storageSlug } from '../src/server/media-storage'
import { resolveMediaPath } from '../src/server/media-path'

test('Rangement : noms compatibles Windows, chemins bornés et jeux homonymes distincts', () => {
  assert.equal(storageSlug('Été : Mario / World ?'), 'ete-mario-world')
  assert.equal(storageSlug('CON'), 'jeu-con')
  const game = { id: 'game-1', title: '../Été : Mario / World ?', platformId: 'snes' }
  const first = gameMediaPath(game, 'image-1', 'SCREENSHOT')
  assert.equal(first, 'jeux/snes/ete-mario-world--game-1/capture-image-1.webp')
  assert.notEqual(first, gameMediaPath({ ...game, id: 'game-2' }, 'image-1', 'SCREENSHOT'))
  assert.throws(() => gameMediaPath({ ...game, id: '../../outside' }, 'image-1', 'COVER'))
})

test('Rangement : échec DB sans perte, reprise après commit et refus d’écraser un autre fichier', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'luden-storage-test-'))
  try {
    const from = resolveMediaPath(root, 'images/old.webp')
    const to = resolveMediaPath(root, 'jeux/snes/mario--game/jaquette-image.webp')
    await mkdir(path.dirname(from), { recursive: true })
    await writeFile(from, 'image originale')
    const move = {
      id: 'image',
      from: 'images/old.webp',
      to: 'jeux/snes/mario--game/jaquette-image.webp',
      sha256: await imageHash(from),
    }
    await mkdir(path.dirname(to), { recursive: true })
    await writeFile(`${to}.pending`, 'copie interrompue')
    await assert.rejects(
      relocateImage(root, move, async () => {
        throw new Error('DB indisponible')
      }),
    )
    assert.equal(await readFile(from, 'utf8'), 'image originale')
    let committed = false
    await relocateImage(root, move, async () => {
      committed = true
    })
    assert.ok(committed)
    await assert.rejects(access(from))
    assert.equal(await readFile(to, 'utf8'), 'image originale')
    await relocateImage(root, move, async () => {})
    await mkdir(path.dirname(from), { recursive: true })
    await writeFile(from, 'image originale')
    await writeFile(to, 'autre image')
    await assert.rejects(
      relocateImage(root, move, async () => {
        assert.fail('Ne doit pas modifier la DB')
      }),
      /Copie différente/,
    )
    assert.equal(await readFile(from, 'utf8'), 'image originale')
    assert.equal(await readFile(to, 'utf8'), 'autre image')
  } finally {
    // Only this freshly-created test directory, never the personal data root.
    await rm(root, { recursive: true, force: true })
  }
})
