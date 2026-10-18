import { useState, type CSSProperties } from 'react'
import type { Game } from '../lib/types'
import { readPresentation } from '../lib/game-visuals'
import { platformScenePresentation, sceneStyle } from '../lib/presentation'
import { mediaImageSources } from '../lib/image-variants'
import { GameBackground } from './game-background'
import { Cover } from './ui'

export function GameScene({
  game,
  compact,
  onExpand,
  disabled,
}: {
  game: Game
  compact: boolean
  onExpand?: () => void
  disabled: boolean
}) {
  const visuals = readPresentation(game.presentation)
  const presentation = platformScenePresentation(game.platform)
  const box = visuals.box ?? game.media.find((m) => m.category === 'BOX')?.mediaId ?? game.coverId
  const support = visuals.support ?? game.media.find((m) => m.category === 'MEDIA')?.mediaId
  const mediaWidth = (id: string) => game.media.find((m) => m.mediaId === id)?.media.width
  const [failedLogo, setFailedLogo] = useState(false)
  return (
    <div
      className={`game-scene ${visuals.background ? 'has-background' : 'without-background'} ${presentation.gallery.wide ? 'scene-wide-box' : ''}`}
      data-presentation={presentation.preset}
      style={sceneStyle(presentation.scene) as CSSProperties}
    >
      {compact && visuals.background && (
        <GameBackground mediaId={visuals.background} crop={visuals.sidebarCrop} />
      )}
      {(compact || !visuals.background) && <div className="scene-shade" />}
      <div className="scene-identity">
        {!compact && (
          <span className="scene-platform">
            {game.platform.name}
            {game.releaseYear ? ` · ${game.releaseYear}` : ''}
          </span>
        )}
        {visuals.logo && !failedLogo ? (
          <img
            className="scene-logo"
            {...(compact
              ? mediaImageSources(
                  `/media/${visuals.logo}`,
                  mediaWidth(visuals.logo),
                  '(max-width: 800px) 34vw, 12vw',
                )
              : { src: `/media/${visuals.logo}` })}
            alt={game.title}
            onError={() => setFailedLogo(true)}
          />
        ) : compact ? (
          <span className="scene-wordmark" aria-hidden="true">
            {game.title}
          </span>
        ) : (
          <h1>{game.title}</h1>
        )}
        {!compact && (
          <>
            <div className="scene-genres">
              {game.genres.slice(0, 3).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
            <span className="scene-caption">Votre collection. Votre histoire.</span>
          </>
        )}
      </div>
      <div className={`scene-objects ${support && support !== box ? 'has-support' : ''}`}>
        <Cover
          game={{
            ...game,
            coverUrl: box ? `/media/${box}` : null,
            cover:
              box === game.coverId ? game.cover : game.media.find((m) => m.mediaId === box)?.media,
          }}
          className="scene-box"
          ratio={presentation.gallery.ratio}
          original={!compact}
          sizes="auto, (max-width: 800px) 65vw, 24vw"
        />
        {support &&
          support !== box &&
          (compact ? (
            <span className="scene-support-stand">
              <img
                className="scene-support"
                {...mediaImageSources(
                  `/media/${support}`,
                  mediaWidth(support),
                  '(max-width: 800px) 45vw, 17vw',
                )}
                alt={`Support de ${game.title}`}
              />
            </span>
          ) : (
            <img
              className="scene-support"
              src={`/media/${support}`}
              alt={`Support de ${game.title}`}
            />
          ))}
      </div>
      {compact && onExpand && (
        <button
          type="button"
          className="scene-open"
          disabled={disabled}
          onClick={onExpand}
          aria-label={`Ouvrir la fiche complète de ${game.title}`}
        />
      )}
    </div>
  )
}
