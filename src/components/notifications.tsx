import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, X } from 'lucide-react'

const NotificationContext = createContext<(message: string) => void>(() => undefined)

export function Notifications({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string } | null>(null)
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(timer)
  }, [notice])
  return (
    <NotificationContext.Provider value={(message) => setNotice({ message })}>
      {children}
      <div className="notification-region" role="status" aria-live="polite" aria-atomic="true">
        {notice && (
          <div className="success-notification">
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>{notice.message}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Fermer la notification"
              onClick={() => setNotice(null)}
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  return useContext(NotificationContext)
}
