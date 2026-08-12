import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/dom'
import type { Middleware, Placement, ReferenceElement } from '@floating-ui/dom'
import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'

import { getTransformOrigin, resolveDirection } from './utils.ts'

export interface FloatingPositionOptions {
  contentElement?: Accessor<HTMLElement | undefined>
  detachedPadding?: Accessor<number>
  deferPositioned?: boolean
  fitViewport?: Accessor<boolean>
  floatingElement: Accessor<HTMLElement | undefined>
  flip?: Accessor<boolean | string>
  getReferenceElement: () => ReferenceElement | undefined
  gutter: Accessor<number>
  hideWhenDetached?: Accessor<boolean>
  onPlacementChange: (placement: Placement) => void
  onPositionedChange: (positioned: boolean) => void
  open: Accessor<boolean>
  overlap?: Accessor<boolean>
  overflowPadding: Accessor<number>
  placement: Accessor<Placement>
  sameWidth?: Accessor<boolean>
  shift?: Accessor<number>
  slide?: Accessor<boolean>
}

/** Shared Floating UI pipeline for poppers, menus, and listboxes. */
export function useFloatingPosition(options: FloatingPositionOptions): void {
  createEffect(() => {
    if (!options.open()) {
      options.onPositionedChange(false)
      return
    }

    const floatingElement = options.floatingElement()
    const referenceElement = options.getReferenceElement()

    if (!floatingElement || !referenceElement) {
      options.onPositionedChange(false)
      return
    }

    const direction = resolveDirection()
    const flipOption = options.flip?.() ?? true
    const fallbackPlacements = typeof flipOption === 'string' ? flipOption.split(' ') : undefined
    if (
      fallbackPlacements &&
      !fallbackPlacements.every((placement) =>
        /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(placement),
      )
    ) {
      throw new Error('`flip` expects a space-delimited list of placements')
    }
    let positionedFrame: number | undefined

    const setPositioned = (): void => {
      if (!options.deferPositioned || typeof requestAnimationFrame !== 'function') {
        options.onPositionedChange(true)
        return
      }

      positionedFrame ??= requestAnimationFrame(() => {
        positionedFrame = undefined
        options.onPositionedChange(true)
      })
    }

    const updatePosition = async (): Promise<void> => {
      const floating = options.floatingElement()
      const reference = options.getReferenceElement()

      if (!floating || !reference) {
        return
      }

      const styleElement = options.contentElement?.() ?? floating
      const overflowPadding = options.overflowPadding()
      const middleware: Middleware[] = [
        offset((state) => {
          const crossAxis = options.shift?.() ?? 0
          const hasAlignment = Boolean(state.placement.split('-')[1])

          return {
            alignmentAxis: crossAxis,
            crossAxis: !hasAlignment ? crossAxis : undefined,
            mainAxis: options.gutter(),
          }
        }),
      ]

      if (flipOption !== false) {
        middleware.push(
          flip({
            fallbackPlacements: fallbackPlacements as Placement[] | undefined,
            padding: overflowPadding,
          }),
        )
      }

      const slide = options.slide?.() ?? true
      const overlap = options.overlap?.() ?? true
      if (slide || overlap) {
        middleware.push(
          shift({
            crossAxis: overlap,
            mainAxis: slide,
            padding: overflowPadding,
          }),
        )
      }

      middleware.push(
        size({
          padding: overflowPadding,
          apply({ availableHeight, availableWidth, rects }) {
            const referenceWidth = Math.round(rects.reference.width)

            styleElement.style.setProperty('--mo-popper-anchor-width', `${referenceWidth}px`)
            styleElement.style.setProperty(
              '--mo-popper-content-available-width',
              `${Math.floor(availableWidth)}px`,
            )
            styleElement.style.setProperty(
              '--mo-popper-content-available-height',
              `${Math.floor(availableHeight)}px`,
            )
            styleElement.style.setProperty(
              '--mo-popper-content-overflow-padding',
              `${overflowPadding}px`,
            )
            if (options.sameWidth?.()) {
              styleElement.style.width = `${referenceWidth}px`
            }

            if (options.fitViewport?.()) {
              styleElement.style.maxWidth = `${Math.floor(availableWidth)}px`
              styleElement.style.maxHeight = `${Math.floor(availableHeight)}px`
            }
          },
        }),
      )

      if (options.hideWhenDetached?.()) {
        middleware.push(hide({ padding: options.detachedPadding?.() ?? 0 }))
      }

      const position = await computePosition(reference, floating, {
        middleware,
        placement: options.placement(),
        platform: {
          ...platform,
          isRTL: () => direction === 'rtl',
        },
        strategy: 'absolute',
      })
      const referenceContext = 'contextElement' in reference ? reference.contextElement : undefined

      if (
        !options.open() ||
        options.floatingElement() !== floating ||
        options.getReferenceElement() !== reference ||
        !floating.isConnected ||
        (reference instanceof Element && !reference.isConnected) ||
        (referenceContext instanceof Element && !referenceContext.isConnected)
      ) {
        return
      }

      options.onPlacementChange(position.placement)
      styleElement.style.setProperty(
        '--mo-popper-content-transform-origin',
        getTransformOrigin(position.placement, direction),
      )

      Object.assign(floating.style, {
        left: '0',
        position: 'absolute',
        top: '0',
        transform: `translate3d(${Math.round(position.x)}px, ${Math.round(position.y)}px, 0)`,
        visibility:
          options.hideWhenDetached?.() && position.middlewareData.hide?.referenceHidden
            ? 'hidden'
            : 'visible',
      })
      setPositioned()
    }

    const cleanupAutoUpdate = autoUpdate(referenceElement, floatingElement, updatePosition, {
      elementResize: typeof ResizeObserver === 'function',
    })

    onCleanup(() => {
      cleanupAutoUpdate()
      if (positionedFrame !== undefined && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(positionedFrame)
      }
      if (options.floatingElement() === floatingElement) {
        options.onPositionedChange(false)
        floatingElement.style.visibility = 'hidden'
      }
    })
  })
}
