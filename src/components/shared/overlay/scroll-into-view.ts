/** Reveal an overlay item without scrolling the document behind its portal. */
export function scrollIntoViewWithin(element: HTMLElement, boundary: HTMLElement): void {
  if (!boundary.contains(element)) {
    return
  }

  for (
    let container = element.parentElement;
    container && boundary.contains(container);
    container = container.parentElement
  ) {
    if (container.scrollHeight > container.clientHeight) {
      const item = element.getBoundingClientRect()
      const viewport = container.getBoundingClientRect()
      const top = viewport.top + container.clientTop
      const bottom = top + container.clientHeight

      if (item.top < top) {
        container.scrollTop += item.top - top
      } else if (item.bottom > bottom) {
        container.scrollTop += item.bottom - bottom
      }
    }
    if (container === boundary) {
      break
    }
  }
}
