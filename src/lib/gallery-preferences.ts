import { cleanLibrarySearch, gallerySearch, type GallerySearch } from './gallery'

export function galleryPreferenceKey(pathname: string) {
  return `luden:gallery:v1:${pathname.replace(/\/$/, '')}`
}

export function restoreGalleryPreferences(
  raw: string | null,
  search: GallerySearch,
  libraryOnly = false,
): GallerySearch {
  try {
    const saved = gallerySearch.safeParse(JSON.parse(raw ?? '{}'))
    if (!saved.success) return search
    // Search text is transient. Explicit URL choices always take precedence.
    const preferences = { ...saved.data }
    delete preferences.q
    const restored = {
      ...preferences,
      ...Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined)),
    }
    return libraryOnly ? cleanLibrarySearch(restored) : restored
  } catch {
    return search
  }
}

export function saveGalleryPreferences(pathname: string, filters: GallerySearch) {
  try {
    const preferences =
      pathname.replace(/\/$/, '') === '/library' ? cleanLibrarySearch(filters) : { ...filters }
    delete preferences.q
    localStorage.setItem(galleryPreferenceKey(pathname), JSON.stringify(preferences))
  } catch {
    // Storage can be disabled or full; the gallery remains usable through its URL.
  }
}
