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
  onCleanup,
  splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider'
import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useEventListenerMap } from '../../shared/use-event-listener'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import type { TransitionPresenceMotion } from '../../shared/use-transition-presence'
import { callHandler, callRef, cn, useId } from '../../shared/utils'

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

export interface PopperTriggerProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  children?: JSX.Element
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
  triggerElement: Accessor<HTMLSpanElement | undefined>
  setTriggerElement: (element: HTMLSpanElement | undefined) => void
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
    triggerElement,
    setTriggerElement,
    setPositionerElement,
    positionerPositioned,
    contentPresence,
    currentPlacement,
  }

  return <PopperProvider value={context}>{props.children}</PopperProvider>
}

export function PopperTrigger(props: PopperTriggerProps): JSX.Element {
  const context = usePopperContext()
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'style',
    'ref',
    'onBlur',
    'onClick',
    'onFocus',
    'onPointerEnter',
    'onPointerLeave',
    'describeTrigger',
    'toggleOnClick',
  ])
  const children = createMemo(() => local.children)
  const options = context.options

  return (
    <span
      data-slot="trigger"
      ref={(element) => {
        context.setTriggerElement(element)
        callRef(local.ref, element)
      }}
      tabIndex={-1}
      aria-controls={context.contentPresence.present() ? context.contentId() : undefined}
      aria-describedby={
        (local.describeTrigger ?? options.describeTrigger) && context.contentPresence.present()
          ? context.contentId()
          : undefined
      }
      aria-expanded={context.isOpen()}
      {...rest}
      style={local.style}
      class={cn('outline-none', local.class)}
      onBlur={(event) => {
        const { defaultPrevented } = callHandler(event, local.onBlur)
        if (!defaultPrevented) {
          options.onTriggerBlur?.(context.getControls())
        }
      }}
      onClick={(event) => {
        const { defaultPrevented } = callHandler(event, local.onClick)
        if (!defaultPrevented && (local.toggleOnClick ?? options.toggleOnClick)) {
          context.getControls().toggle()
        }
      }}
      onFocus={(event) => {
        const { defaultPrevented } = callHandler(event, local.onFocus)
        if (!defaultPrevented) {
          options.onTriggerFocus?.(context.getControls())
        }
      }}
      onPointerEnter={(event) => {
        const { defaultPrevented } = callHandler(event, local.onPointerEnter)
        if (!defaultPrevented) {
          options.onTriggerPointerEnter?.(context.getControls())
        }
      }}
      onPointerLeave={(event) => {
        const { defaultPrevented } = callHandler(event, local.onPointerLeave)
        if (!defaultPrevented) {
          options.onTriggerPointerLeave?.(context.getControls())
        }
      }}
    >
      {children()}
    </span>
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
    onPointerEnter: () => options.onContentPointerEnter?.(context.getControls()),
    onPointerLeave: () => options.onContentPointerLeave?.(context.getControls()),
    ref: (element) => {
      context.setContentElement(element)
      context.contentPresence.setElement(element)
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
    <Show when={context.contentPresence.present()}>
      <Portal>
        <div
          ref={context.setPositionerElement}
          data-slot="positioner"
          data-positioned={context.positionerPositioned() ? '' : undefined}
          style={{ visibility: 'hidden', ...props.positionerStyle }}
          class={cn('left-0 top-0 fixed z-50', props.positionerClass)}
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
