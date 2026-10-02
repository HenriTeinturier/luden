import { useBlocker, useLocation, useRouter } from '@tanstack/react-router'

type GameView = 'sidebar' | 'full' | 'edit'
type ViewState = { gameView?: { scope: string; mode: GameView } }

// Full view and editing share one history step above the preview.
// Replacing that step on full → edit makes Back return directly to the preview.
export function useGameViewHistory(scope: string, busy: boolean) {
  const router = useRouter()
  const location = useLocation()
  const stored = (location.state as ViewState).gameView
  const mode = stored?.scope === scope ? stored.mode : 'sidebar'

  useBlocker({
    disabled: !busy || mode === 'sidebar',
    enableBeforeUnload: false,
    shouldBlockFn: () => true,
  })

  function setMode(next: GameView) {
    if (next === mode) return
    if (next === 'sidebar') {
      router.history.back({ ignoreBlocker: true })
      return
    }
    const { href, state } = router.history.location
    const nextState = { ...state, gameView: { scope, mode: next } }
    if (mode === 'sidebar') router.history.push(href, nextState, { ignoreBlocker: true })
    else router.history.replace(href, nextState, { ignoreBlocker: true })
  }

  function reset() {
    const { href, state } = router.history.location
    if ((state as ViewState).gameView)
      router.history.replace(href, { ...state, gameView: undefined })
  }

  return { mode, setMode, reset }
}
