import path from 'node:path'

export function dataRoot() {
  const root = process.env.LUDEN_DATA_DIR?.trim() ?? ''
  if (!root || !path.isAbsolute(root))
    throw new Error('Renseignez un chemin absolu dans LUDEN_DATA_DIR, puis redémarrez Luden.')
  return path.resolve(root)
}

export function thumbnailRoot(root: string) {
  const configured = process.env.LUDEN_CACHE_DIR?.trim()
  if (configured && !path.isAbsolute(configured))
    throw new Error('LUDEN_CACHE_DIR doit être un chemin absolu.')
  const target = path.resolve(configured || path.join(root, 'cache'), 'thumbnails', 'v1')
  for (const folder of ['media', 'backups']) {
    const relative = path.relative(path.resolve(root, folder), target)
    if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative)))
      throw new Error('Le cache doit être séparé des images et des sauvegardes.')
  }
  return target
}

export function backupLimit() {
  const mb = Number(process.env.LUDEN_BACKUP_MAX_MB || 10240)
  if (!Number.isSafeInteger(mb) || mb < 1 || mb > 102400)
    throw new Error('LUDEN_BACKUP_MAX_MB doit être compris entre 1 et 102400.')
  return mb * 1024 * 1024
}
