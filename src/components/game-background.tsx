import { useEffect, useRef, useState } from 'react'
import { cropGeometry, type BackgroundCrop } from '../lib/game-visuals'

// The same geometry drives the editor preview and the displayed sidebar.
export function GameBackground({
  mediaId,
  crop,
  onChange,
}: {
  mediaId: string
  crop: BackgroundCrop
  onChange?: (crop: BackgroundCrop) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [image, setImage] = useState({ width: 1, height: 1 })
  const drag = useRef<{ x: number; y: number; crop: BackgroundCrop } | null>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize(entry.contentRect))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const geometry = cropGeometry(size.width, size.height, image.width, image.height, crop)
  return (
    <div
      ref={ref}
      className={`game-background ${onChange ? 'is-draggable' : ''}`}
      aria-hidden="true"
      onPointerDown={
        onChange
          ? (event) => {
              if (event.button !== 0) return
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = { x: event.clientX, y: event.clientY, crop }
            }
          : undefined
      }
      onPointerMove={
        onChange
          ? (event) => {
              const start = drag.current
              if (!start) return
              const clamp = (n: number) => Math.min(100, Math.max(0, n))
              onChange({
                ...crop,
                x:
                  geometry.width > size.width + 1
                    ? clamp(
                        start.crop.x -
                          ((event.clientX - start.x) / (geometry.width - size.width)) * 100,
                      )
                    : 50,
                y:
                  geometry.height > size.height + 1
                    ? clamp(
                        start.crop.y -
                          ((event.clientY - start.y) / (geometry.height - size.height)) * 100,
                      )
                    : 50,
              })
            }
          : undefined
      }
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <img
        src={`/media/${mediaId}`}
        alt=""
        draggable={false}
        style={geometry}
        onLoad={(event) =>
          setImage({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
      />
    </div>
  )
}
