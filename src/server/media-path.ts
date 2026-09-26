import path from 'node:path'

export function resolveMediaPath(root: string, relative: string) {
  if (!root.trim() || !path.isAbsolute(root))
    throw new Error('Renseigne un chemin absolu dans LUDEN_DATA_DIR, puis redémarre Luden.')
  if (!relative || path.isAbsolute(relative) || relative.includes('\\') || relative.includes(':'))
    throw new Error('Chemin média invalide.')
  const mediaRoot = path.resolve(root, 'media')
  const result = path.resolve(mediaRoot, relative)
  const within = path.relative(mediaRoot, result)
  if (!within || within.startsWith('..') || path.isAbsolute(within))
    throw new Error('Chemin média invalide.')
  return result
}
