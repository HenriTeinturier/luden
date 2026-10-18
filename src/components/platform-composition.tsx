import type { Platform } from '../lib/types'
import type { PlatformVisual } from '../lib/platform-visuals'
import { artworkStyle, platformArtwork } from '../lib/platform-artwork'
import { PlatformArt } from './ui'

export function PlatformComposition({
  platform,
  visuals,
}: {
  platform: Platform
  visuals: PlatformVisual[]
}) {
  const artwork = platformArtwork(platform.id, platform.customization, visuals)
  return (
    <div
      className="platform-composition"
      style={artworkStyle(platform.customization.sidebar, artwork.sidebarBackground)}
    >
      {artwork.sidebarLogo && <img className="composition-logo" src={artwork.sidebarLogo} alt="" />}
      {artwork.sidebarHardware ? (
        <img className="composition-hardware" src={artwork.sidebarHardware} alt="" />
      ) : !platform.customization.hiddenAssets.includes('SIDEBAR_HARDWARE') &&
        !platform.customization.hiddenAssets.includes('HARDWARE') ? (
        <PlatformArt platform={platform} />
      ) : null}
      <div className="composition-title">
        <h2>{platform.name}</h2>
        <p>Vos jeux. Vos souvenirs.</p>
      </div>
    </div>
  )
}
