import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  inline,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/dom'
import type { Coords, Middleware, Placement, ReferenceElement } from '@floating-ui/dom'
import type { Accessor } from 'solid-js'
import { createEffect, createRoot, getOwner, onCleanup, runWithOwner } from 'solid-js'

import { useLocale } from '../../../provider/locale/locale-context'
import { settle } from '../../../shared/utils'

import { resolveDirection } from './direction'
import { getTransformOrigin } from './transform-origin'

function setStyleProperty(element: HTMLElement, property: string, value: string): void {
  if (element.style.getPropertyValue(property) !== value) {
    element.style.setProperty(property, value)
  }
}

export interface FloatingPositionOptions {
  contentElement?: Accessor<HTMLElement | undefined>
  detachedPadding?: Accessor<number>
  deferPositioned?: boolean
  fitViewport?: Accessor<boolean>
  floatingElement: Accessor<HTMLElement | undefined>
  flip?: Accessor<boolean | Array<Placement>>
  getReferenceElement: () => ReferenceElement | undefined
  gutter: Accessor<number>
  hideWhenDetached?: Accessor<boolean>
  /** Viewport coordinates to transition from on the first positioning commit. */
  initialPosition?: Accessor<Coords | undefined>
  /** Pointer coordinates anchoring the content to the hovered line of a wrapped reference. */
  inline?: Accessor<Coords | undefined>
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
  const providerDirection = useLocale().dir
  let positioned: boolean | undefined
  let consumedInitialPosition: Coords | undefined
  // Effect callbacks and cleanups join the running flush; frame, timer, and
  // post-`await` callers run unowned and settle the write themselves.
  const publishPositioned = (value: boolean): void => {
    if (positioned !== value) {
      positioned = value
      options.onPositionedChange(value)
    }
  }

  const owner = getOwner()
  createEffect(
    () =>
      [
        options.open(),
        options.floatingElement(),
        options.getReferenceElement(),
        providerDirection(),
      ] as const,
    ([open, floating, reference, direction]) => {
      publishPositioned(false)
      if (!open || !floating || !reference) {
        return
      }
      return runWithOwner(owner, () =>
        createRoot((dispose) => {
          let active = true
          let requestVersion = 0
          let positionedFrame: number | undefined
          let positionedTimeout: ReturnType<typeof setTimeout> | undefined
          let cleanupAutoUpdate: (() => void) | undefined
          let updatePosition: () => Promise<void>
          let committed: (() => boolean) | undefined
          let pendingTransform: string | undefined
          const ownerWindow = floating.ownerDocument.defaultView
          const ownedStyles = new Map<
            string,
            { element: HTMLElement; value: string; priority: string; applied: string }
          >()
          const restoreStyle = (property: string): void => {
            const saved = ownedStyles.get(property)
            if (!saved) {
              return
            }
            if (
              saved.element.style.getPropertyValue(property) === saved.applied &&
              saved.element.style.getPropertyPriority(property) === ''
            ) {
              saved.element.style.setProperty(property, saved.value, saved.priority)
            }
            ownedStyles.delete(property)
          }
          const writeStyle = (element: HTMLElement, property: string, value: string): void => {
            let entry = ownedStyles.get(property)
            if (!entry) {
              entry = {
                element,
                value: element.style.getPropertyValue(property),
                priority: element.style.getPropertyPriority(property),
                applied: value,
              }
              ownedStyles.set(property, entry)
            }
            if (element.style.getPropertyValue(property) !== value) {
              element.style.setProperty(property, value)
            }
            entry.applied = element.style.getPropertyValue(property)
          }
          const cancelPositioned = (): void => {
            if (positionedFrame !== undefined) {
              ownerWindow?.cancelAnimationFrame(positionedFrame)
            }
            if (positionedTimeout !== undefined) {
              clearTimeout(positionedTimeout)
            }
            positionedFrame = undefined
            positionedTimeout = undefined
          }
          const markPositioned = (): void => {
            cancelPositioned()
            if (committed?.()) {
              // Commit coordinates before enabling position transitions.
              floating.getBoundingClientRect()
              settle(() => publishPositioned(true))
              if (pendingTransform !== undefined && committed?.()) {
                // Commit the starting position with transition styles before changing the transform.
                floating.getBoundingClientRect()
                floating.style.transform = pendingTransform
                pendingTransform = undefined
              }
            }
          }

          Object.assign(floating.style, { position: 'absolute', left: '0', top: '0' })
          onCleanup(() => {
            active = false
            committed = undefined
            cleanupAutoUpdate?.()
            cancelPositioned()
            for (const property of ownedStyles.keys()) {
              restoreStyle(property)
            }
            floating.style.visibility = 'hidden'
            publishPositioned(false)
          })

          createEffect(
            () => [
              (() => options.contentElement?.())(),
              (() => options.detachedPadding?.())(),
              (() => options.fitViewport?.())(),
              (() => options.flip?.())(),
              options.gutter(),
              (() => options.hideWhenDetached?.())(),
              (() => options.inline?.())(),
              options.overflowPadding(),
              (() => options.overlap?.())(),
              options.placement(),
              (() => options.sameWidth?.())(),
              (() => options.shift?.())(),
              (() => options.slide?.())(),
            ],
            ([
              contentElement,
              detachedPadding,
              fitViewport,
              flipValue,
              gutter,
              hideWhenDetached,
              inlineCoords,
              overflowPadding,
              overlapValue,
              placement,
              sameWidth,
              shiftValue,
              slideValue,
            ]) => {
              const flipOption = flipValue ?? true
              const overlap = overlapValue ?? true
              const crossAxisOffset = shiftValue ?? 0
              const slide = slideValue ?? true
              const fallbackPlacements = Array.isArray(flipOption) ? flipOption : undefined
              updatePosition = async () => {
                if (!active) {
                  return
                }
                const version = ++requestVersion
                const styleElement = contentElement ?? floating
                for (const [property, saved] of ownedStyles) {
                  if (
                    saved.element !== styleElement ||
                    !(property === 'width' ? sameWidth : fitViewport)
                  ) {
                    restoreStyle(property)
                  }
                }
                const textDirection = resolveDirection(floating, direction)
                const dpr = floating.ownerDocument.defaultView?.devicePixelRatio || 1
                const round = (value: number): number => Math.round(value * dpr) / dpr
                const referenceContext =
                  'contextElement' in reference ? reference.contextElement : undefined
                const isCurrent = (): boolean =>
                  active &&
                  version === requestVersion &&
                  floating.isConnected &&
                  (!('isConnected' in reference) || reference.isConnected) &&
                  (!referenceContext || referenceContext.isConnected)
                const middleware: Array<Middleware> = [
                  offset({
                    mainAxis: gutter,
                    crossAxis: crossAxisOffset,
                    alignmentAxis: crossAxisOffset,
                  }),
                ]

                if (inlineCoords) {
                  middleware.push(inline({ x: inlineCoords.x, y: inlineCoords.y }))
                }

                if (flipOption !== false) {
                  middleware.push(
                    flip({
                      fallbackPlacements,
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

                      const referenceWidth = round(rects.reference.width)
                      const width = Math.max(0, Math.floor(availableWidth))
                      const height = Math.max(0, Math.floor(availableHeight))

                      setStyleProperty(
                        styleElement,
                        '--mo-popper-anchor-width',
                        `${referenceWidth}px`,
                      )
                      setStyleProperty(
                        styleElement,
                        '--mo-popper-content-available-width',
                        `${width}px`,
                      )
                      setStyleProperty(
                        styleElement,
                        '--mo-popper-content-available-height',
                        `${height}px`,
                      )
                      if (sameWidth) {
                        writeStyle(styleElement, 'width', `${referenceWidth}px`)
                      }

                      if (fitViewport) {
                        writeStyle(styleElement, 'max-width', `${width}px`)
                        writeStyle(styleElement, 'max-height', `${height}px`)
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
                    return {
                      data: {
                        value: getTransformOrigin(state.placement, textDirection, {
                          gutter,
                          overlap,
                          reference: state.rects.reference,
                          shift: state.middlewareData.shift,
                          x: state.x,
                          y: state.y,
                        }),
                      },
                    }
                  },
                })

                const position = await computePosition(reference, floating, {
                  middleware,
                  placement,
                  platform: {
                    ...platform,
                    isRTL: () => textDirection === 'rtl',
                  },
                  strategy: 'absolute',
                })
                if (!isCurrent()) {
                  return
                }

                settle(() => options.onPlacementChange(position.placement))
                if (!isCurrent()) {
                  return
                }
                setStyleProperty(
                  styleElement,
                  '--mo-popper-content-transform-origin',
                  position.middlewareData.moraineTransformOrigin.value,
                )

                const transform = `translate3d(${round(position.x)}px, ${round(position.y)}px, 0)`
                const initialPosition = !committed ? options.initialPosition?.() : undefined
                if (initialPosition && initialPosition !== consumedInitialPosition) {
                  const scale = await platform.getScale(floating)
                  if (!isCurrent()) {
                    return
                  }
                  floating.style.transform = 'none'
                  const rect = floating.getBoundingClientRect()
                  const initialTransform = `translate3d(${round((initialPosition.x - rect.left) / scale.x)}px, ${round((initialPosition.y - rect.top) / scale.y)}px, 0)`
                  if (floating.style.transform !== initialTransform) {
                    floating.style.transform = initialTransform
                  }
                  consumedInitialPosition = initialPosition
                  pendingTransform = transform
                } else if (pendingTransform !== undefined && !positioned) {
                  pendingTransform = transform
                } else {
                  if (floating.style.transform !== transform) {
                    floating.style.transform = transform
                  }
                  pendingTransform = undefined
                }
                const targetVisibility =
                  hideWhenDetached && position.middlewareData.hide?.referenceHidden
                    ? 'hidden'
                    : 'visible'
                if (floating.style.visibility !== targetVisibility) {
                  floating.style.visibility = targetVisibility
                }
                committed = isCurrent
                if (!positioned) {
                  if (!options.deferPositioned && pendingTransform === undefined) {
                    settle(() => publishPositioned(true))
                  } else if (positionedFrame === undefined && positionedTimeout === undefined) {
                    if (typeof ownerWindow?.requestAnimationFrame === 'function') {
                      positionedFrame = ownerWindow.requestAnimationFrame(markPositioned)
                    }
                    positionedTimeout = setTimeout(markPositioned, 16)
                  }
                }
              }

              if (cleanupAutoUpdate) {
                void updatePosition()
              } else if (
                floating.isConnected &&
                (!('isConnected' in reference) || reference.isConnected)
              ) {
                cleanupAutoUpdate = autoUpdate(
                  reference,
                  floating,
                  () => {
                    void updatePosition()
                  },
                  { elementResize: typeof ResizeObserver === 'function' },
                )
              }
              return () => {
                requestVersion += 1
              }
            },
          )
          return dispose
        }),
      )
    },
  )
}

/** Synchronizes the floating positioner element's z-index with the rendered content element's CSS z-index. */
export function usePositionerZIndex(
  positionerElement: Accessor<HTMLElement | undefined>,
  contentElement: Accessor<HTMLElement | undefined>,
): void {
  createEffect(
    () => [positionerElement(), contentElement()],
    ([positioner, content]) => {
      if (!positioner || !content) {
        return
      }

      queueMicrotask(() => {
        if (
          positioner.isConnected &&
          content.isConnected &&
          positionerElement() === positioner &&
          contentElement() === content
        ) {
          const contentZIndex = content.ownerDocument.defaultView?.getComputedStyle(content).zIndex
          if (contentZIndex && contentZIndex !== 'auto') {
            positioner.style.zIndex = contentZIndex
          }
        }
      })
    },
  )
}
