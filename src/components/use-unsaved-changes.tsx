import { useEffect, useRef } from 'react'
import { useBlocker } from '@tanstack/react-router'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

export function useUnsavedChanges({
  dirty,
  busy,
  description = 'Les modifications non enregistrées seront perdues.',
}: {
  dirty: boolean
  busy: boolean
  description?: string
}) {
  const navigationAllowed = useRef(false)
  const shouldBlock = () => !navigationAllowed.current && (dirty || busy)
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  })
  const pendingBlocker = useRef(blocker)
  useEffect(() => {
    pendingBlocker.current = blocker
  }, [blocker])

  // Only bypass the guard after the server has confirmed a save or deletion.
  async function afterSave(navigate: () => Promise<void>) {
    navigationAllowed.current = true
    pendingBlocker.current.reset?.()
    try {
      await navigate()
    } finally {
      navigationAllowed.current = false
    }
  }

  const leaveConfirmation = (
    <AlertDialog.Root
      open={blocker.status === 'blocked'}
      onOpenChange={(open) => {
        if (!open) blocker.reset?.()
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title>
            {busy ? 'Opération en cours' : 'Quitter sans enregistrer ?'}
          </AlertDialog.Title>
          <AlertDialog.Description>
            {busy ? 'Attendez la fin de l’opération avant de quitter cette page.' : description}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel className="button secondary">
              Continuer à modifier
            </AlertDialog.Cancel>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => blocker.proceed?.()}
            >
              Quitter sans enregistrer
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
  return { afterSave, leaveConfirmation }
}
