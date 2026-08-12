import type { Placement } from '@floating-ui/dom'
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
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import type { TransitionPresenceMotion } from '../../shared/use-transition-presence.ts'
import { cn, useId } from '../../shared/utils.ts'

import { useFloatingPosition } from './floating.ts'
import { useOverlayInteraction } from './interaction.ts'
import type { OverlayTriggerProps } from './trigger.ts'
import { validateOverlayTrigger } from './trigger.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusTrigger,
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

export interface PopperProps {
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
  options: PopperProps
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

/** Low-level positioned overlay primitives. */
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

  useFloatingPosition({
    detachedPadding: () => merged.detachedPadding,
    deferPositioned: true,
    fitViewport: () => merged.fitViewport,
    floatingElement: positionerElement,
    flip: () => merged.flip,
    getReferenceElement: triggerElement,
    gutter: () => merged.gutter,
    hideWhenDetached: () => merged.hideWhenDetached,
    onPlacementChange: setInternalCurrentPlacement,
    onPositionedChange: setPositionerPositioned,
    open: contentPresence.present,
    overlap: () => merged.overlap,
    overflowPadding: () => merged.overflowPadding,
    placement: () => merged.placement,
    sameWidth: () => merged.sameWidth,
    shift: () => merged.shift,
    slide: () => merged.slide,
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

    if (merged.modal) {
      queueMicrotask(() => {
        focusContent(currentContent)
      })
    }

    onCleanup(() => {
      active = false
      releaseAriaHide?.()
      releaseScrollLock?.()
    })
  })

  useOverlayInteraction({
    enabled: contentPresence.present,
    contentElement,
    triggerElement,
    requireContent: true,
    onPointerOutside: (event) => {
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
    onFocusOutside: (event) => {
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
    },
    onEscape: (event) => {
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
    },
    onDeactivate: (context) => {
      // Restore focus while this entry is still topmost so lower overlays
      // treat the resulting focus event as owned by the closing layer.
      if (merged.restoreFocusOnClose && context.isTop()) {
        focusTrigger(triggerElement())
      }
    },
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

function PopperTrigger(props: PopperTriggerProps): JSX.Element {
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

function PopperContent(props: PopperContentComponentProps): JSX.Element {
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

Popper.Content = PopperContent
Popper.Trigger = PopperTrigger
