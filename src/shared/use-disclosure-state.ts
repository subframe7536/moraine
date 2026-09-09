import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

export interface UseDisclosureStateOptions {
  disabled?: Accessor<boolean>
  open: Accessor<boolean>
}

export function useDisclosureState(options: UseDisclosureStateOptions) {
  const disabled = createMemo(() => Boolean(options.disabled?.()))
  const dataAttrs = createMemo(() => ({
    'data-closed': options.open() ? undefined : '',
    'data-disabled': disabled() ? '' : undefined,
    'data-expanded': options.open() ? '' : undefined,
  }))
  const [contentHeight, setContentHeight] = createSignal(0)
  let contentEl: HTMLDivElement | undefined
  let resizeObserver: ResizeObserver | undefined

  function measureContentHeight(element = contentEl): void {
    if (!element || element !== contentEl) {
      return
    }

    setContentHeight(element.scrollHeight)
  }

  function queueContentHeightMeasurement(element = contentEl): void {
    queueMicrotask(() => {
      if (!element?.isConnected) {
        return
      }

      measureContentHeight(element)
    })
  }

  createEffect(() => {
    options.open()

    queueContentHeightMeasurement()
  })

  function setContentElement(element: HTMLDivElement): void {
    resizeObserver?.disconnect()
    contentEl = element
    measureContentHeight(element)
    queueContentHeightMeasurement(element)

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        if (element.isConnected) {
          measureContentHeight(element)
        }
      })
      resizeObserver.observe(element)
    }
  }

  onCleanup(() => {
    contentEl = undefined
    resizeObserver?.disconnect()
    resizeObserver = undefined
  })

  return {
    contentHeight,
    dataAttrs,
    disabled,
    setContentElement,
  }
}
