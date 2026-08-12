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
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onMount,
  onCleanup,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import { OVERLAY_POSITIONER_CLASS } from '../../shared/cva-common.class.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useEventListenerMap } from '../../shared/use-event-listener.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import type { TransitionPresenceMotion } from '../../shared/use-transition-presence.ts'
import { cn, useId } from '../../shared/utils.ts'

import { isInsideOverlayLayer, isTopOverlay, pushOverlayLayer } from './overlay-stack.ts'
import type { OverlayStackEntry } from './overlay-stack.ts'
import type { OverlayTriggerProps } from './trigger.ts'
import { validateOverlayTrigger } from './trigger.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  createCompositionState,
  createOutsidePressHandlers,
  focusContent,
  focusTrigger,
  getTransformOrigin,
  isComposingKeyEvent,
  resolveDirection,
  trapFocusInContainer,
} from './utils.ts'

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
  onPointerEnter?: (event: PointerEvent) => void
  onPointerLeave?: (event: PointerEvent) => void
  ref: (element: HTMLDivElement) => void
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  tabIndex: number
}

export interface PopperRootProps {
  ariaDescribedBy?: string
  ariaLabelledBy?: string
  closeOnOutsideFocus?: boolean
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
  onTriggerPointerEnter?: (controls: PopperControls, event: PointerEvent) => void
  onTriggerPointerLeave?: (controls: PopperControls, event: PointerEvent) => void
  onContentBlur?: (controls: PopperControls) => void
  onContentFocus?: (controls: PopperControls) => void
  onContentPointerEnter?: (controls: PopperControls, event: PointerEvent) => void
  onContentPointerLeave?: (controls: PopperControls, event: PointerEvent) => void
  open?: boolean
  overlap?: boolean
  overflowPadding?: number
  placement?: PopperPlacement
  preventScroll?: boolean
  restoreFocusOnClose?: boolean
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  sameWidth?: boolean
  shift?: number
  slide?: boolean
  toggleOnClick?: boolean
  transitionMode?: TransitionPresenceMotion
  children?: JSX.Element
}

export interface PopperTriggerProps {
  children?: (props: OverlayTriggerProps) => JSX.Element
  describeTrigger?: boolean
  toggleOnClick?: boolean
}

export interface PopperContentComponentProps {
  contentRender: ComponentOrElement<PopperContentContext>
  positionerClass?: string
  positionerStyle?: JSX.CSSProperties
}

export interface PopperContentContext {
  close: () => void
  contentProps: PopperContentProps
  currentPlacement: Accessor<string>
}

interface PopperContext {
  options: PopperRootProps
  contentId: Accessor<string>
  isOpen: Accessor<boolean>
  getControls: () => PopperControls
  setOpen: (open: boolean) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  contentMounted: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  positionerElement: Accessor<HTMLDivElement | undefined>
  setPositionerElement: (element: HTMLDivElement | undefined) => void
  positionerPositioned: Accessor<boolean>
  contentPresence: ReturnType<typeof useTransitionPresence>
  currentPlacement: Accessor<string>
}

const [PopperProvider, usePopperContext] = createContextProvider<PopperContext>('Popper')

export function setPopperTestPlacementAccessor(accessor: Accessor<string> | undefined): void {
  popperTestPlacementAccessor = accessor
}

export function PopperRoot(props: PopperRootProps): JSX.Element {
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
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [internalCurrentPlacement, setInternalCurrentPlacement] = createSignal<string>('bottom')
  const currentPlacement = createMemo(
    () => popperTestPlacementAccessor?.() ?? internalCurrentPlacement(),
  )
  const contentPresence = useTransitionPresence({
    open: isOpen,
    get mode() {
      return merged.transitionMode
    },
  })
  const contentMounted = createMemo(
    () => contentPresence.present() || Boolean(merged.forceMount && !merged.disabled),
  )

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
    if (!contentMounted()) {
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
      setPositionerPositioned(false)
      if (positioner) {
        positioner.style.visibility = 'hidden'
      }
      return
    }

    const direction = resolveDirection()
    const fallbackPlacements = typeof merged.flip === 'string' ? merged.flip.split(' ') : undefined
    if (
      fallbackPlacements &&
      !fallbackPlacements.every((placement) =>
        /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(placement),
      )
    ) {
      throw new Error('`flip` expects a space-delimited list of placements')
    }

    const updatePosition = async () => {
      const nextTrigger = triggerElement()
      const nextPositioner = positionerElement()

      if (
        !nextTrigger ||
        !nextPositioner ||
        !nextTrigger.isConnected ||
        !nextPositioner.isConnected
      ) {
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
            fallbackPlacements: fallbackPlacements as PopperPlacement[] | undefined,
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

      if (
        triggerElement() !== nextTrigger ||
        positionerElement() !== nextPositioner ||
        !contentPresence.present() ||
        !nextTrigger.isConnected ||
        !nextPositioner.isConnected
      ) {
        return
      }

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

    const cleanupAutoUpdate = autoUpdate(trigger, positioner, updatePosition, {
      elementResize: typeof ResizeObserver === 'function',
    })

    onCleanup(() => {
      cleanupAutoUpdate()
      if (
        enablePositionerTransitionFrame !== undefined &&
        typeof cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(enablePositionerTransitionFrame)
        enablePositionerTransitionFrame = undefined
      }
      if (positionerElement() === positioner) {
        setPositionerPositioned(false)
        positioner.style.visibility = 'hidden'
      }
    })
  })

  createEffect(() => {
    const positioner = positionerElement()
    const content = contentElement()

    if (!positioner || !content) {
      return
    }

    queueMicrotask(() => {
      untrack(() => {
        if (
          positionerElement() === positioner &&
          contentElement() === content &&
          positioner.isConnected &&
          content.isConnected
        ) {
          const contentZIndex = getComputedStyle(content).zIndex
          if (contentZIndex && contentZIndex !== 'auto') {
            positioner.style.zIndex = contentZIndex
          }
        }
      })
    })
  })

  createEffect(() => {
    if (!contentPresence.present() || typeof document === 'undefined') {
      return
    }

    const currentContent = contentElement()
    const currentPositioner = positionerElement()
    if (!currentContent || !currentPositioner) {
      return
    }

    const releaseScrollLock =
      merged.modal || merged.preventScroll ? acquireBodyScrollLock() : undefined
    let active = true
    let releaseAriaHide: (() => void) | undefined
    if (merged.modal) {
      queueMicrotask(() => {
        if (active && currentContent.isConnected) {
          releaseAriaHide = acquireAriaHideOutside(currentContent)
        }
      })
    }

    const stackEntry: OverlayStackEntry = {
      contentElement,
      triggerElement,
    }
    const releaseStack = pushOverlayLayer(stackEntry)

    if (merged.modal) {
      queueMicrotask(() => {
        focusContent(currentContent)
      })
    }

    const isInside = (target: Node): boolean => isInsideOverlayLayer(stackEntry, target)

    const composition = createCompositionState()
    const outsidePress = createOutsidePressHandlers({
      isInside,
      isEnabled: () => isTopOverlay(stackEntry),
      onPress: (event) => {
        merged.onPointerDownOutside?.(event)

        if (event.defaultPrevented) {
          return
        }

        if (merged.dismissible) {
          event.preventDefault()
          setOpen(false)
          return
        }

        event.preventDefault()
        merged.onClosePrevent?.()
      },
    })
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
      if (event.key !== 'Escape' || isComposingKeyEvent(event, composition)) {
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
        event.preventDefault()
        setOpen(false)
        return
      }

      event.preventDefault()
      merged.onClosePrevent?.()
    }

    useEventListenerMap(
      document,
      {
        pointerdown: outsidePress.pointerdown,
        pointermove: outsidePress.pointermove,
        pointerup: outsidePress.pointerup,
        pointercancel: outsidePress.pointercancel,
        focusin: onDocumentFocusIn,
        keydown: onDocumentKeyDown,
        compositionstart: composition.onCompositionStart,
        compositionend: composition.onCompositionEnd,
      },
      false,
    )

    onCleanup(() => {
      active = false
      releaseAriaHide?.()
      // Restore focus while this entry is still topmost so lower overlays
      // treat the resulting focus event as owned by the closing layer.
      if (merged.restoreFocusOnClose && isTopOverlay(stackEntry)) {
        focusTrigger(triggerElement())
      }

      releaseStack()
      releaseScrollLock?.()
    })
  })

  const context: PopperContext = {
    options: merged,
    contentId,
    isOpen,
    getControls,
    setOpen,
    contentElement,
    setContentElement,
    contentMounted,
    triggerElement,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    positionerPositioned,
    contentPresence,
    currentPlacement,
  }

  return <PopperProvider value={context}>{props.children}</PopperProvider>
}

export function PopperTrigger(props: PopperTriggerProps): JSX.Element {
  const context = usePopperContext()
  const options = context.options
  const triggerRender = createMemo(() => props.children)
  const triggerProps: OverlayTriggerProps = {
    get 'aria-controls'() {
      return context.contentPresence.present() ? context.contentId() : undefined
    },
    get 'aria-describedby'() {
      return options.describeTrigger && context.contentPresence.present()
        ? context.contentId()
        : undefined
    },
    get 'aria-expanded'() {
      return context.isOpen() ? 'true' : 'false'
    },
    'data-slot': 'trigger',
    ref: (element: HTMLElement | undefined) => {
      if (!element) {
        return
      }

      context.setTriggerElement(element)
      onCleanup(() => {
        if (context.triggerElement() === element) {
          context.setTriggerElement(undefined)
        }
      })
    },
    onBlur: () => options.onTriggerBlur?.(context.getControls()),
    onClick: (event: MouseEvent) => {
      if (!event.defaultPrevented && options.toggleOnClick) {
        context.getControls().toggle()
      }
    },
    onFocus: () => options.onTriggerFocus?.(context.getControls()),
    onPointerEnter: (event) => options.onTriggerPointerEnter?.(context.getControls(), event),
    onPointerLeave: (event) => options.onTriggerPointerLeave?.(context.getControls(), event),
  }

  onMount(() => {
    if (triggerRender()) {
      validateOverlayTrigger(context.triggerElement(), 'Popper')
    }
  })

  return (
    <Show when={triggerRender()}>
      {(render) => renderComponentOrElement(render(), triggerProps)}
    </Show>
  )
}

export function PopperContent(props: PopperContentComponentProps): JSX.Element {
  const context = usePopperContext()
  const options = context.options
  const contentRender = createMemo(() => props.contentRender)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    if (options.modal) {
      trapFocusInContainer(event, context.contentElement())
    }
  }

  const contentProps: PopperContentProps = {
    'aria-describedby': options.ariaDescribedBy,
    'aria-labelledby': options.ariaLabelledBy,
    'aria-modal': options.modal ? true : undefined,
    id: context.contentId(),
    onBlur: () => options.onContentBlur?.(context.getControls()),
    onFocus: () => options.onContentFocus?.(context.getControls()),
    onKeyDown: onContentKeyDown,
    onPointerEnter: (event) => options.onContentPointerEnter?.(context.getControls(), event),
    onPointerLeave: (event) => options.onContentPointerLeave?.(context.getControls(), event),
    ref: (element) => {
      context.setContentElement(element)
      context.contentPresence.setElement(element)
      onCleanup(() => {
        if (context.contentElement() === element) {
          context.setContentElement(undefined)
          context.contentPresence.setElement(undefined)
        }
      })
    },
    role: options.role,
    tabIndex: -1,
  }
  Object.defineProperties(contentProps, {
    'data-closed': {
      enumerable: true,
      get: () => context.contentPresence.dataAttrs()['data-closed'],
    },
    'data-expanded': {
      enumerable: true,
      get: () => context.contentPresence.dataAttrs()['data-expanded'],
    },
  })

  return (
    <Show when={context.contentMounted()}>
      <Portal>
        <div
          ref={(element) => {
            context.setPositionerElement(element)
            onCleanup(() => {
              if (context.positionerElement() === element) {
                context.setPositionerElement(undefined)
              }
            })
          }}
          data-slot="positioner"
          data-positioned={context.positionerPositioned() ? '' : undefined}
          style={{ visibility: 'hidden', ...props.positionerStyle }}
          class={cn(OVERLAY_POSITIONER_CLASS, 'z-50', props.positionerClass)}
        >
          {renderComponentOrElement(contentRender(), {
            close: () => context.setOpen(false),
            contentProps,
            currentPlacement: context.currentPlacement,
          })}
        </div>
      </Portal>
    </Show>
  )
}
