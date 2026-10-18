import type { PlatformCustomization } from './platform-customization'
import type { PlatformVisual } from './platform-visuals'

// Compare editable values only. Server URLs, dimensions and position gaps after
// an immediate deletion do not constitute unsaved changes; array order does.
export function platformEditorSnapshot({
  customization,
  catalogPlatformId,
  slideshowEnabled,
  slideshowSeconds,
  visuals,
}: {
  customization: PlatformCustomization
  catalogPlatformId: string | null
  slideshowEnabled: boolean
  slideshowSeconds: string | number
  visuals: PlatformVisual[]
}) {
  return JSON.stringify({
    customization: {
      ...customization,
      categories: customization.categories?.slice().sort() ?? null,
      hiddenAssets: customization.hiddenAssets.slice().sort(),
    },
    catalogPlatformId,
    slideshowEnabled,
    slideshowSeconds: Number(slideshowSeconds),
    visuals: visuals.map(({ id, kind, caption, active, isDefault }) => ({
      id,
      kind,
      caption,
      active,
      isDefault,
    })),
  })
}
