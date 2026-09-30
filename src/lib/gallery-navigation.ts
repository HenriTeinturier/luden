export type GalleryCardPosition = { id: string; top: number; centerX: number }

// Use rendered rows so responsive widths, mixed covers and category gaps all work.
export function verticalGameNeighbor(
  cards: GalleryCardPosition[],
  currentId: string,
  direction: number,
) {
  const current = cards.find((card) => card.id === currentId)
  if (!current) return undefined
  const candidates = cards.filter((card) => (card.top - current.top) * direction > 2)
  const nextRow = candidates.reduce(
    (distance, card) => Math.min(distance, Math.abs(card.top - current.top)),
    Infinity,
  )
  return candidates
    .filter((card) => Math.abs(Math.abs(card.top - current.top) - nextRow) < 2)
    .reduce<GalleryCardPosition | undefined>(
      (nearest, card) =>
        !nearest ||
        Math.abs(card.centerX - current.centerX) < Math.abs(nearest.centerX - current.centerX)
          ? card
          : nearest,
      undefined,
    )?.id
}

export function stepGalleryColumns(displayed: number, bonus: number, delta: number) {
  return Math.max(4, Math.min(10, displayed - bonus + Math.sign(delta)))
}
