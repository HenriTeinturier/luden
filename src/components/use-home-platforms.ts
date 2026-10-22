import { useEffect, useState } from 'react'
import {
  defaultHomePlatforms,
  homePlatformsKey,
  parseHomePlatforms,
  type HomePlatformsPreference,
} from '../lib/home-platforms'

const eventName = 'luden:home-platforms-changed'
export function useHomePlatforms() {
  const [preference, setPreference] = useState(defaultHomePlatforms)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const read = () => {
      try {
        setPreference(parseHomePlatforms(localStorage.getItem(homePlatformsKey)))
      } catch {
        setPreference(defaultHomePlatforms)
      }
      setReady(true)
    }
    read()
    window.addEventListener('storage', read)
    window.addEventListener(eventName, read)
    return () => {
      window.removeEventListener('storage', read)
      window.removeEventListener(eventName, read)
    }
  }, [])
  function save(next: HomePlatformsPreference) {
    localStorage.setItem(homePlatformsKey, JSON.stringify(next))
    setPreference(next)
    window.dispatchEvent(new Event(eventName))
  }
  return { preference, ready, save }
}
