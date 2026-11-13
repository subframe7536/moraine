/**
 * jsdom has no layout engine: a virtualizer sees a 0x0 scroll element and rows it cannot measure.
 * These spreads give the scroll element a fixed viewport and rows a fixed size. Spread them into
 * the virtualizer options.
 */
export function scrollViewport(width: number, height: number) {
  return {
    observeElementRect: (
      _instance: unknown,
      callback: (rect: { width: number; height: number }) => void,
    ) => {
      callback({ width, height })
      return () => {}
    },
  }
}

export function measuredRows(size: number | ((element: HTMLElement) => number)) {
  return {
    measureElement: (element: HTMLElement) => (typeof size === 'number' ? size : size(element)),
  }
}
