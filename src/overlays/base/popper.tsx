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
import type { Middleware, Placement } from '@floating-ui/dom'
import type { Accessor, JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useControllableValue } from '../../shared/use-controllable-value'
import { useEventListenerMap } from '../../shared/use-event-listener'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import type { TransitionPresenceMotion } from '../../shared/use-transition-presence'
import { cn, useId } from '../../shared/utils'

import { isInsideDescendantOverlay, isTopOverlay, pushOverlayLayer } from './overlay-stack'
import type { OverlayStackEntry } from './overlay-stack'
import {
  acquireBodyScrollLock,
  focusContent,
  focusTrigger,
  getTransformOrigin,
  resolveDirection,
  trapFocusInContainer,
} from './utils'

export type PopperPlacement = Placement

let popperTestPlacementAccessor: Accessor<string> | undefined

interface PopperControls {
  close: () => void
  isOpen: boolean
  open: () => void
  toggle: () => void
}

interface PopperInteractOutsideEvent {
  defaultPrevented: boolean
  originalEvent: FocusEvent
  preventDefault: () => void
}

interface PopperContentProps {
  'aria-describedby'?: string
  'aria-labelledby'?: string
  'aria-modal'?: true

  'data-closed'?: string
  'data-expanded'?: string

  id: string
  onBlur?: () => void
  onFocus?: () => void
  onKeyDown: (event: KeyboardEvent) => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  ref: (element: HTMLDivElement) => void
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  tabIndex: number
}

export interface PopperProps {
  ariaDescribedBy?: string
  ariaLabelledBy?: string
  closeOnOutsideFocus?: boolean
  content: (context: PopperContentContext) => JSX.Element
  defaultOpen?: boolean
  describeTrigger?: boolean
  detachedPadding?: number
  disabled?: boolean
  dismissible?: boolean
  fitViewport?: boolean
  flip?: boolean | string
  forceMount?: boolean
  gutter?: number
  hideWhenDetached?: boolean
  id?: string
  modal?: boolean
  onClosePrevent?: () => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onInteractOutside?: (event: PopperInteractOutsideEvent) => void
  onOpenChange?: (open: boolean) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onTriggerBlur?: (controls: PopperControls) => void
  onTriggerFocus?: (controls: PopperControls) => void
  onTriggerPointerEnter?: (controls: PopperControls) => void
  onTriggerPointerLeave?: (controls: PopperControls) => void
  onContentBlur?: (controls: PopperControls) => void
  onContentFocus?: (controls: PopperControls) => void
  onContentPointerEnter?: (controls: PopperControls) => void
  onContentPointerLeave?: (controls: PopperControls) => void
  open?: boolean
  overlap?: boolean
  overflowPadding?: number
  placement?: PopperPlacement
  positionerClass?: string
  positionerStyle?: JSX.CSSProperties
  preventScroll?: boolean
  restoreFocusOnClose?: boolean
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  sameWidth?: boolean
  shift?: number
  slide?: boolean
  toggleOnClick?: boolean
  transitionMode?: TransitionPresenceMotion
  trigger: JSX.Element
  triggerClass?: string
  triggerStyle?: JSX.CSSProperties
}

export interface PopperContentContext {
  close: () => void
  contentProps: PopperContentProps
  currentPlacement: Accessor<string>
}

export function setPopperTestPlacementAccessor(accessor: Accessor<string> | undefined): void {
  popperTestPlacementAccessor = accessor
}

export function Popper(props: PopperProps): JSX.Element {
  const merged = mergeProps(
    {
      closeOnOutsideFocus: true,
      detachedPadding: 0,
      dismissible: true,
      disabled: false,
      fitViewport: false,
      flip: true,
      forceMount: false,
      gutter: 0,
      hideWhenDetached: false,
      modal: false,
      overlap: false,
      overflowPadding: 4,
      placement: 'bottom' as PopperPlacement,
      restoreFocusOnClose: true,
      sameWidth: false,
      shift: 0,
      slide: true,
      toggleOnClick: true,
      transitionMode: 'both' as const,
    },
    props,
  )
  const rootId = useId(() => merged.id, 'popper')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setControlledOpen] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(open()) && !merged.disabled)
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>()
  const [positionerPositioned, setPositionerPositioned] = createSignal(false)
  const [triggerElement, setTriggerElement] = createSignal<HTMLSpanElement | undefined>()
  const [internalCurrentPlacement, setInternalCurrentPlacement] = createSignal<string>('bottom')
  const currentPlacement = createMemo(
    () => popperTestPlacementAccessor?.() ?? internalCurrentPlacement(),
  )
  const contentPresence = useTransitionPresence({
    open: () => Boolean((isOpen() || merged.forceMount) && !merged.disabled),
    get mode() {
      return merged.transitionMode
    },
  })

  let cleanupAutoUpdate: (() => void) | undefined
  let enablePositionerTransitionFrame: number | undefined

  function schedulePositionerTransition(): void {
    if (positionerPositioned() || enablePositionerTransitionFrame !== undefined) {
      return
    }

    if (typeof requestAnimationFrame !== 'function') {
      setPositionerPositioned(true)
      return
    }

    enablePositionerTransitionFrame = requestAnimationFrame(() => {
      setPositionerPositioned(true)
      enablePositionerTransitionFrame = undefined
    })
  }

  function setOpen(nextOpen: boolean): void {
    if (merged.disabled || nextOpen === isOpen()) {
      return
    }

    setControlledOpen(nextOpen)
    merged.onOpenChange?.(nextOpen)
  }

  function getControls(): PopperControls {
    return {
      close: () => {
        setOpen(false)
      },
      isOpen: isOpen(),
      open: () => {
        setOpen(true)
      },
      toggle: () => {
        setOpen(!isOpen())
      },
    }
  }

  createEffect(() => {
    setInternalCurrentPlacement(merged.placement)
  })

  createEffect(() => {
    if (!contentPresence.present()) {
      cleanupAutoUpdate?.()
      cleanupAutoUpdate = undefined
      setContentElement(undefined)
      setPositionerElement(undefined)
      setPositionerPositioned(false)
      contentPresence.setElement(undefined)
    }
  })

  createEffect(() => {
    const trigger = triggerElement()
    const positioner = positionerElement()

    if (!contentPresence.present() || !trigger || !positioner) {
      return
    }

    const direction = resolveDirection()

    const updatePosition = async () => {
      if (!triggerElement() || !positionerElement()) {
        return
      }

      const nextTrigger = triggerElement()
      const nextPositioner = positionerElement()

      if (!nextTrigger || !nextPositioner) {
        return
      }

      const middleware: Middleware[] = [
        // oxlint-disable-next-line subf/solid-reactivity
        offset((opt) => {
          const hasAlignment = Boolean(opt.placement.split('-')[1])

          return {
            mainAxis: merged.gutter,
            crossAxis: !hasAlignment ? merged.shift : undefined,
            alignmentAxis: merged.shift,
          }
        }),
      ]

      if (merged.flip !== false) {
        middleware.push(
          flip({
            padding: merged.overflowPadding,
            fallbackPlacements:
              typeof merged.flip === 'string'
                ? (merged.flip.split(' ') as PopperPlacement[])
                : undefined,
          }),
        )
      }

      if (merged.slide || merged.overlap) {
        middleware.push(
          shift({
            mainAxis: merged.slide,
            crossAxis: merged.overlap,
            padding: merged.overflowPadding,
          }),
        )
      }

      middleware.push(
        size({
          padding: merged.overflowPadding,
          apply({ availableHeight, availableWidth, rects }) {
            const referenceWidth = Math.round(rects.reference.width)

            nextPositioner.style.setProperty('--mo-popper-anchor-width', `${referenceWidth}px`)
            nextPositioner.style.setProperty(
              '--mo-popper-content-available-width',
              `${Math.floor(availableWidth)}px`,
            )
            nextPositioner.style.setProperty(
              '--mo-popper-content-available-height',
              `${Math.floor(availableHeight)}px`,
            )
            nextPositioner.style.setProperty(
              '--mo-popper-content-overflow-padding',
              `${merged.overflowPadding}px`,
            )

            if (merged.sameWidth) {
              nextPositioner.style.width = `${referenceWidth}px`
            }

            if (merged.fitViewport) {
              nextPositioner.style.maxWidth = `${Math.floor(availableWidth)}px`
              nextPositioner.style.maxHeight = `${Math.floor(availableHeight)}px`
            }
          },
        }),
      )

      if (merged.hideWhenDetached) {
        middleware.push(hide({ padding: merged.detachedPadding }))
      }

      const position = await computePosition(nextTrigger, nextPositioner, {
        placement: merged.placement,
        strategy: 'absolute',
        middleware,
        platform: {
          ...platform,
          isRTL: () => direction === 'rtl',
        },
      })

      setInternalCurrentPlacement(position.placement)
      nextPositioner.style.setProperty(
        '--mo-popper-content-transform-origin',
        getTransformOrigin(position.placement, direction),
      )

      Object.assign(nextPositioner.style, {
        left: '0',
        top: '0',
        transform: `translate3d(${Math.round(position.x)}px, ${Math.round(position.y)}px, 0)`,
        visibility:
          merged.hideWhenDetached && position.middlewareData.hide?.referenceHidden
            ? 'hidden'
            : 'visible',
      })
      schedulePositionerTransition()
    }

    cleanupAutoUpdate = autoUpdate(trigger, positioner, updatePosition)
    void updatePosition()

    onCleanup(() => {
      cleanupAutoUpdate?.()
      cleanupAutoUpdate = undefined
      if (
        enablePositionerTransitionFrame !== undefined &&
        typeof cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(enablePositionerTransitionFrame)
        enablePositionerTransitionFrame = undefined
      }
    })
  })

  createEffect(() => {
    if (!contentPresence.present() || typeof document === 'undefined') {
      return
    }

    const releaseScrollLock =
      merged.modal || merged.preventScroll ? acquireBodyScrollLock() : undefined

    const stackEntry: OverlayStackEntry = {
      contentElement,
      triggerElement,
    }
    const releaseStack = pushOverlayLayer(stackEntry)

    if (merged.modal) {
      const currentContent = contentElement()

      queueMicrotask(() => {
        focusContent(currentContent)
      })
    }

    const isInside = (target: Node): boolean => {
      if (contentElement()?.contains(target) || triggerElement()?.contains(target)) {
        return true
      }

      return isInsideDescendantOverlay(stackEntry, target)
    }

    const onDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      merged.onPointerDownOutside?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (merged.dismissible) {
        setOpen(false)
        return
      }

      event.preventDefault()
      merged.onClosePrevent?.()
    }
    const onDocumentFocusIn = (event: FocusEvent) => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      const interactEvent: PopperInteractOutsideEvent = {
        defaultPrevented: false,
        originalEvent: event,
        preventDefault() {
          this.defaultPrevented = true
        },
      }

      merged.onInteractOutside?.(interactEvent)

      if (interactEvent.defaultPrevented) {
        return
      }

      if (merged.closeOnOutsideFocus && merged.dismissible) {
        setOpen(false)
        return
      }

      if (!merged.dismissible) {
        event.preventDefault()
        merged.onClosePrevent?.()

        if (merged.modal) {
          const currentContent = contentElement()

          queueMicrotask(() => {
            focusContent(currentContent)
          })
        }
      }
    }
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      merged.onEscapeKeyDown?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (merged.dismissible) {
        setOpen(false)
        return
      }

      event.preventDefault()
      merged.onClosePrevent?.()
    }

    useEventListenerMap(
      document,
      {
        pointerdown: onDocumentPointerDown,
        focusin: onDocumentFocusIn,
        keydown: onDocumentKeyDown,
      },
      true,
    )

    onCleanup(() => {
      releaseStack()
      releaseScrollLock?.()

      if (merged.restoreFocusOnClose) {
        focusTrigger(triggerElement())
      }
    })
  })

  function onContentKeyDown(event: KeyboardEvent): void {
    if (!merged.modal) {
      return
    }

    trapFocusInContainer(event, contentElement())
  }

  return (
    <>
      <span
        ref={setTriggerElement}
        tabIndex={-1}
        data-slot="trigger"
        aria-controls={contentPresence.present() ? contentId() : undefined}
        aria-describedby={
          merged.describeTrigger && contentPresence.present() ? contentId() : undefined
        }
        aria-expanded={isOpen()}
        style={merged.triggerStyle}
        class={cn('outline-none', merged.triggerClass)}
        onBlur={() => {
          merged.onTriggerBlur?.(getControls())
        }}
        onClick={() => {
          if (merged.toggleOnClick) {
            getControls().toggle()
          }
        }}
        onFocus={() => {
          merged.onTriggerFocus?.(getControls())
        }}
        onPointerEnter={() => {
          merged.onTriggerPointerEnter?.(getControls())
        }}
        onPointerLeave={() => {
          merged.onTriggerPointerLeave?.(getControls())
        }}
      >
        {merged.trigger}
      </span>

      <Show when={contentPresence.present()}>
        <Portal>
          <div
            ref={setPositionerElement}
            data-slot="positioner"
            data-positioned={positionerPositioned() ? '' : undefined}
            style={{ visibility: 'hidden', ...merged.positionerStyle }}
            class={cn('left-0 top-0 fixed z-50', merged.positionerClass)}
          >
            {merged.content({
              close: () => {
                setOpen(false)
              },
              contentProps: {
                'aria-describedby': merged.ariaDescribedBy,
                'aria-labelledby': merged.ariaLabelledBy,
                'aria-modal': merged.modal ? true : undefined,
                ...contentPresence.dataAttrs(),
                id: contentId(),
                onBlur: () => {
                  merged.onContentBlur?.(getControls())
                },
                onFocus: () => {
                  merged.onContentFocus?.(getControls())
                },
                onKeyDown: onContentKeyDown,
                onPointerEnter: () => {
                  merged.onContentPointerEnter?.(getControls())
                },
                onPointerLeave: () => {
                  merged.onContentPointerLeave?.(getControls())
                },
                ref: (element) => {
                  setContentElement(element)
                  contentPresence.setElement(element)
                },
                role: merged.role,
                tabIndex: -1,
              },
              currentPlacement,
            })}
          </div>
        </Portal>
      </Show>
    </>
  )
}
