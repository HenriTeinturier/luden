// One local server process. Stop CLI maintenance and other instances before backup/restore.
let exclusive = false
let active = 0
let drained: (() => void) | undefined
let recovery: Promise<void> | undefined
let blocked = false

export function blockLibraryAccess() {
  blocked = true
}

function ready() {
  if (blocked)
    return Promise.reject(
      new Error(
        'La restauration a été interrompue. Redémarrez Luden pour reprendre la sauvegarde de sécurité.',
      ),
    )
  if (!recovery)
    recovery = import('./backup').then(({ recoverInterruptedRestore }) =>
      recoverInterruptedRestore(),
    )
  return recovery
}

export async function withLibraryAccess<T>(action: () => Promise<T>): Promise<T> {
  await ready()
  if (exclusive) throw new Error('Sauvegarde ou restauration en cours. Réessayez dans un instant.')
  active++
  try {
    return await action()
  } finally {
    active--
    if (active === 0) drained?.()
  }
}

export async function withMaintenance<T>(action: () => Promise<T>): Promise<T> {
  await ready()
  if (exclusive) throw new Error('Une sauvegarde ou restauration est déjà en cours.')
  exclusive = true
  try {
    if (active > 0)
      await new Promise<void>((resolve) => {
        drained = resolve
      })
    return await action()
  } finally {
    drained = undefined
    exclusive = false
  }
}
