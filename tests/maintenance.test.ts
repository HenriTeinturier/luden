import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blockLibraryAccess, withLibraryAccess, withMaintenance } from '../src/server/maintenance'

test('Maintenance : attendre les opérations en cours et refuser les nouvelles, même après échec', async () => {
  process.env.LUDEN_DATA_DIR = ''
  let release!: () => void
  let started!: () => void
  const entered = new Promise<void>((resolve) => {
    started = resolve
  })
  const events: string[] = []
  const reading = withLibraryAccess(async () => {
    started()
    await new Promise<void>((resolve) => {
      release = resolve
    })
    events.push('finished')
  })
  await entered
  const maintenance = withMaintenance(async () => {
    events.push('maintenance')
    await assert.rejects(withLibraryAccess(async () => 1))
    throw new Error('échec simulé')
  })
  const failed = assert.rejects(maintenance, /échec simulé/)
  await Promise.resolve()
  await assert.rejects(withMaintenance(async () => 1))
  assert.deepEqual(events, [])
  release()
  await reading
  await failed
  assert.deepEqual(events, ['finished', 'maintenance'])
  assert.equal(await withLibraryAccess(async () => 'ok'), 'ok')
  blockLibraryAccess()
  await assert.rejects(
    withLibraryAccess(async () => 'unsafe'),
    /Redémarrez Luden/,
  )
  await assert.rejects(
    withMaintenance(async () => 'unsafe'),
    /Redémarrez Luden/,
  )
})
