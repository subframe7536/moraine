export interface CompositionState {
  dispose: () => void
  isComposing: () => boolean
  onCompositionStart: () => void
  onCompositionEnd: () => void
}

export function createCompositionState(): CompositionState {
  let composing = false
  let endCompositionTimeout: ReturnType<typeof setTimeout> | undefined

  const clearEndCompositionTimeout = (): void => {
    if (endCompositionTimeout !== undefined) {
      clearTimeout(endCompositionTimeout)
      endCompositionTimeout = undefined
    }
  }

  return {
    dispose: () => {
      clearEndCompositionTimeout()
      composing = false
    },
    isComposing: () => composing,
    onCompositionStart: () => {
      clearEndCompositionTimeout()
      composing = true
    },
    onCompositionEnd: () => {
      clearEndCompositionTimeout()
      // Safari can dispatch the Escape that cancels IME conversion immediately
      // after compositionend. Keep this bounded guard through that key event.
      endCompositionTimeout = setTimeout(() => {
        composing = false
        endCompositionTimeout = undefined
      }, 100)
    },
  }
}
