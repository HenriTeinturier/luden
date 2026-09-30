import { createContext, useContext } from 'react'

export const GameSelectionContext = createContext<{
  selectedId: string | null
  sidebarVisible: boolean
  reopenSidebar?: () => void
  open: (id: string, sequence: string[], trigger: HTMLElement) => void
} | null>(null)
export const useGameSelection = () => useContext(GameSelectionContext)
