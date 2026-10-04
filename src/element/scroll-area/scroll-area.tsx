import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { callRef } from '../../shared/utils'

import { scrollAreaDataAttributes, scrollAreaRecipe } from './scroll-area.recipe'
import type { ScrollAreaProps, ScrollAreaT } from './scroll-area.types'

/** Native scroll container with optional fades at overflowing edges. */
export function ScrollArea(props: ScrollAreaProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'children',
    'ref',
    'orientation',
    'shadow',
    'hideScrollbar',
    'shadowSize',
    'offset',
    'visibility',
    'onVisibilityChange',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(scrollAreaRecipe, local, {
    inheritedStyles: () => {
      if (local.shadowSize === undefined) {
        return undefined
      }
      return {
        styles: {
          root: { '--scroll-area-shadow-size': `${Math.max(0, local.shadowSize)}px` },
        },
      }
    },
  })
  const orientation = () => resolved.variants.orientation
  const shadow = () => resolved.variants.shadow === true
  const [overflow, setOverflow] = createSignal<Exclude<ScrollAreaT.Visibility, 'auto'>>('none')
  let root: HTMLDivElement | undefined

  const visible = () => {
    if (!shadow()) {
      return 'none'
    }
    const visibility = local.visibility ?? 'auto'
    return visibility === 'auto' ? overflow() : visibility
  }
  const shadowStart = () =>
    visible() === 'both' || visible() === (orientation() === 'horizontal' ? 'left' : 'top')
  const shadowEnd = () =>
    visible() === 'both' || visible() === (orientation() === 'horizontal' ? 'right' : 'bottom')

  createEffect(
    on([shadow, orientation, () => local.offset], ([enabled, axis, offset]) => {
      if (!enabled || !root) {
        setOverflow('none')
        return
      }

      const element = root
      const view = element.ownerDocument.defaultView!
      const horizontal = axis === 'horizontal'
      const threshold = Math.max(0, offset ?? 0)
      let disposed = false

      function measure(): void {
        if (disposed) {
          return
        }
        const extent = horizontal
          ? element.scrollWidth - element.clientWidth
          : element.scrollHeight - element.clientHeight
        let position = horizontal ? element.scrollLeft : element.scrollTop
        // RTL scrollLeft is negative from the right edge in modern browsers.
        if (horizontal && view.getComputedStyle(element).direction === 'rtl') {
          position += extent
        }
        position = Math.max(0, Math.min(position, extent))
        const before = position > threshold
        // Scroll positions may be fractional while client/scroll dimensions are integers.
        const after = extent - position > threshold + 1
        const start = horizontal ? 'left' : 'top'
        const end = horizontal ? 'right' : 'bottom'
        const next = before && after ? 'both' : before ? start : after ? end : 'none'
        if (next !== overflow()) {
          setOverflow(next)
          local.onVisibilityChange?.(next)
        }
      }

      const resizeObserver =
        typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined
      function observeSizes(): void {
        resizeObserver?.disconnect()
        resizeObserver?.observe(element)
        for (const child of element.children) {
          resizeObserver?.observe(child)
        }
      }
      const mutationObserver = new MutationObserver(() => {
        observeSizes()
        measure()
      })
      mutationObserver.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'dir'],
      })
      observeSizes()
      element.addEventListener('scroll', measure, { passive: true })
      element.addEventListener('load', measure, true)
      view.addEventListener('resize', measure)
      // Measure after hydration completes so caller callbacks cannot alter its initial tree.
      queueMicrotask(measure)
      onCleanup(() => {
        disposed = true
        resizeObserver?.disconnect()
        mutationObserver.disconnect()
        element.removeEventListener('scroll', measure)
        element.removeEventListener('load', measure, true)
        view.removeEventListener('resize', measure)
      })
    }),
  )

  return (
    <div
      data-slot="scroll-area"
      tabIndex={0}
      {...rest}
      ref={(element) => {
        root = element
        callRef(local.ref, element)
      }}
      {...scrollAreaDataAttributes.root({ orientation, shadowStart, shadowEnd })}
      {...resolved.styles.root}
    >
      {local.children}
    </div>
  )
}
