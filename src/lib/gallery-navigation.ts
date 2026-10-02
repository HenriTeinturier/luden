export type GalleryCardPosition = { id: string; top: number; centerX: number }

export function wrapGameIndex(index: number, total: number, delta: number) {
  if (total < 1 || index < 0 || index >= total) return -1
  return (((index + delta) % total) + total) % total
}

export function galleryCardPositions(elements: HTMLElement[]): GalleryCardPosition[] {
  return elements.flatMap((card) => {
    const rect = card.getBoundingClientRect()
    // Layout offsets ignore the hover lift applied to a cover.
    let top = 0
    let element: HTMLElement | null = card
    while (element) {
      top += element.offsetTop
      element = element.offsetParent as HTMLElement | null
    }
    return rect.width && rect.height && card.dataset.gameId
      ? [{ id: card.dataset.gameId, top, centerX: rect.left + rect.width / 2 }]
      : []
  })
}

export function galleryKeyboardNeighbor(
  cards: GalleryCardPosition[],
  currentId: string | undefined,
  key: string,
) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return undefined
  const index = cards.findIndex((card) => card.id === currentId)
  if (index < 0) return cards[0]?.id
  if (key === 'ArrowUp' || key === 'ArrowDown')
    return verticalGameNeighbor(cards, cards[index].id, key === 'ArrowUp' ? -1 : 1)
  return cards[wrapGameIndex(index, cards.length, key === 'ArrowLeft' ? -1 : 1)]?.id
}

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
