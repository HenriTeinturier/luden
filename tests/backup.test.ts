import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { validateArchiveEntry } from '../src/server/backup'
import { thumbnailRoot, backupLimit } from '../src/server/storage-config'

test('Sauvegardes : chemins traversants, liens et fichiers étrangers refusés', () => {
  for (const name of ['manifest.json', 'database.dump', 'media/jeux/snes/jaquette.webp'])
    assert.doesNotThrow(() => validateArchiveEntry(name, 'File', 10))
  for (const name of [
    '../.env',
    '/media/file',
    'media/../../.env',
    'media/./file',
    'C:/media/x',
    'media\\x',
    '.env',
    'media//file',
    'media/CON',
    'media/file.',
  ])
    assert.throws(() => validateArchiveEntry(name, 'File', 1))
  for (const type of ['SymbolicLink', 'Link', 'CharacterDevice', 'FIFO'])
    assert.throws(() => validateArchiveEntry('media/image.webp', type, 1))
  assert.throws(() => validateArchiveEntry('media/image.webp', 'File', -1))
})

test('Stockage : cache séparé, chemin absolu et limite de sauvegarde bornée', () => {
  const previousCache = process.env.LUDEN_CACHE_DIR
  const previousLimit = process.env.LUDEN_BACKUP_MAX_MB
  const root = path.resolve('test-data')
  try {
    delete process.env.LUDEN_CACHE_DIR
    assert.equal(thumbnailRoot(root), path.join(root, 'cache', 'thumbnails', 'v1'))
    process.env.LUDEN_CACHE_DIR = path.resolve('separate-cache')
    assert.equal(thumbnailRoot(root), path.resolve('separate-cache', 'thumbnails', 'v1'))
    for (const value of ['relative', path.join(root, 'media'), path.join(root, 'backups')]) {
      process.env.LUDEN_CACHE_DIR = value
      assert.throws(() => thumbnailRoot(root))
    }
    process.env.LUDEN_BACKUP_MAX_MB = '2'
    assert.equal(backupLimit(), 2 * 1024 * 1024)
    for (const value of ['0', 'NaN', '1000000', '1.5']) {
      process.env.LUDEN_BACKUP_MAX_MB = value
      assert.throws(backupLimit)
    }
  } finally {
    if (previousCache === undefined) delete process.env.LUDEN_CACHE_DIR
    else process.env.LUDEN_CACHE_DIR = previousCache
    if (previousLimit === undefined) delete process.env.LUDEN_BACKUP_MAX_MB
    else process.env.LUDEN_BACKUP_MAX_MB = previousLimit
  }
})
