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

import { getTransformOrigin, resolveDirection } from './utils'

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

    const contentElement = options.contentElement?.()
    const detachedPadding = options.detachedPadding?.()
    const fitViewport = options.fitViewport?.()
    const flipOption = options.flip?.() ?? true
    const gutter = options.gutter()
    const hideWhenDetached = options.hideWhenDetached?.()
    const overflowPadding = options.overflowPadding()
    const overlap = options.overlap?.() ?? true
    const placement = options.placement()
    const sameWidth = options.sameWidth?.()
    const crossAxisOffset = options.shift?.() ?? 0
    const slide = options.slide?.() ?? true
    const direction = resolveDirection(floatingElement)
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
    let positionedTimeout: ReturnType<typeof setTimeout> | undefined
    let active = true
    let requestVersion = 0

    const setPositioned = (version: number): void => {
      if (!active || version !== requestVersion) {
        return
      }

      if (!options.deferPositioned) {
        options.onPositionedChange(true)
        return
      }

      const markPositioned = (): void => {
        if (!active || version !== requestVersion) {
          return
        }
        if (positionedFrame !== undefined && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(positionedFrame)
        }
        positionedFrame = undefined
        if (positionedTimeout !== undefined) {
          clearTimeout(positionedTimeout)
          positionedTimeout = undefined
        }
        options.onPositionedChange(true)
      }

      if (positionedFrame !== undefined && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(positionedFrame)
        positionedFrame = undefined
      }
      if (positionedTimeout !== undefined) {
        clearTimeout(positionedTimeout)
        positionedTimeout = undefined
      }

      if (typeof requestAnimationFrame === 'function') {
        positionedFrame = requestAnimationFrame(markPositioned)
      }

      positionedTimeout = setTimeout(markPositioned, 16)
    }

    const updatePosition = async (): Promise<void> => {
      const floating = options.floatingElement()
      const reference = options.getReferenceElement()

      if (!floating || !reference) {
        return
      }

      const version = ++requestVersion
      const styleElement = contentElement ?? floating
      let transformOrigin: Parameters<typeof getTransformOrigin>[2]
      const isCurrent = (): boolean =>
        active &&
        version === requestVersion &&
        options.open() &&
        options.floatingElement() === floating &&
        options.getReferenceElement() === reference &&
        (options.contentElement?.() ?? floating) === styleElement
      const middleware: Middleware[] = [
        offset((state) => {
          const hasAlignment = Boolean(state.placement.split('-')[1])

          return {
            alignmentAxis: crossAxisOffset,
            crossAxis: !hasAlignment ? crossAxisOffset : undefined,
            mainAxis: gutter,
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
            if (!isCurrent()) {
              return
            }

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
            if (sameWidth) {
              styleElement.style.width = `${referenceWidth}px`
            }

            if (fitViewport) {
              styleElement.style.maxWidth = `${Math.floor(availableWidth)}px`
              styleElement.style.maxHeight = `${Math.floor(availableHeight)}px`
            }
          },
        }),
      )

      if (hideWhenDetached) {
        middleware.push(hide({ padding: detachedPadding ?? 0 }))
      }

      middleware.push({
        name: 'moraineTransformOrigin',
        fn(state) {
          transformOrigin = {
            gutter,
            overlap,
            reference: state.rects.reference,
            shift: state.middlewareData.shift,
            x: state.x,
            y: state.y,
          }
          return {}
        },
      })

      const position = await computePosition(reference, floating, {
        middleware,
        placement,
        platform: {
          ...platform,
          isRTL: () => direction === 'rtl',
        },
        strategy: 'absolute',
      })
      const referenceContext = 'contextElement' in reference ? reference.contextElement : undefined

      if (
        !isCurrent() ||
        !floating.isConnected ||
        (reference instanceof Element && !reference.isConnected) ||
        (referenceContext instanceof Element && !referenceContext.isConnected)
      ) {
        return
      }

      options.onPlacementChange(position.placement)
      styleElement.style.setProperty(
        '--mo-popper-content-transform-origin',
        getTransformOrigin(position.placement, direction, transformOrigin),
      )

      Object.assign(floating.style, {
        left: '0',
        position: 'absolute',
        top: '0',
        transform: `translate3d(${Math.round(position.x)}px, ${Math.round(position.y)}px, 0)`,
        visibility:
          hideWhenDetached && position.middlewareData.hide?.referenceHidden ? 'hidden' : 'visible',
      })
      setPositioned(version)
    }

    const cleanupAutoUpdate = autoUpdate(referenceElement, floatingElement, updatePosition, {
      elementResize: typeof ResizeObserver === 'function',
    })

    onCleanup(() => {
      active = false
      requestVersion += 1
      cleanupAutoUpdate()
      if (positionedFrame !== undefined && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(positionedFrame)
      }
      if (positionedTimeout !== undefined) {
        clearTimeout(positionedTimeout)
      }
      if (options.floatingElement() === floatingElement) {
        options.onPositionedChange(false)
        floatingElement.style.visibility = 'hidden'
      }
    })
  })
}
