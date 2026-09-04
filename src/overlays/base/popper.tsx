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

import { createContextProvider } from '../../shared/create-context-provider'
import { OVERLAY_POSITIONER_CLASS } from '../../shared/recipe-common.class.ts'
import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { callHandler, callRef, cn, useId } from '../../shared/utils'

import { useFloatingPosition } from './floating'
import { useOverlayInteraction } from './interaction'
import type { OverlayTriggerProps } from './trigger'
import { validateOverlayTrigger } from './trigger'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusTrigger,
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
  onPointerEnter?: (event: PointerEvent) => void
  onPointerLeave?: (event: PointerEvent) => void
  ref: (element: HTMLDivElement) => void
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  tabIndex: number
}

export interface PopperProps {
  /** Id of the element that describes the positioned content. */
  ariaDescribedBy?: string

  /** Id of the element that labels the positioned content. */
  ariaLabelledBy?: string

  /**
   * Whether focus moving outside should close the content.
   * @default true
   */
  closeOnOutsideFocus?: boolean

  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether the trigger should reference the content with `aria-describedby`.
   * @default false
   */
  describeTrigger?: boolean

  /**
   * Padding from the clipping boundary used to detect a detached trigger.
   * @default 0
   */
  detachedPadding?: number

  /**
   * Whether trigger interactions and content rendering are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Whether outside interaction and Escape dismiss the content.
   * @default true
   */
  dismissible?: boolean

  /**
   * Whether content dimensions should be constrained to the available viewport.
   * @default false
   */
  fitViewport?: boolean

  /**
   * Whether to flip placement when the preferred side lacks space, or a space-delimited fallback placement list.
   * @default true
   */
  flip?: boolean | string

  /**
   * Whether content remains mounted while closed.
   * @default false
   */
  forceMount?: boolean

  /**
   * Gap in pixels between the trigger and positioned content.
   * @default 0
   */
  gutter?: number

  /**
   * Whether content should be hidden when its trigger is detached from the clipping boundary.
   * @default false
   */
  hideWhenDetached?: boolean

  /** Unique identifier used to derive the content id. */
  id?: string

  /**
   * Whether the content traps focus and hides outside content from assistive technology.
   * @default false
   */
  modal?: boolean

  /** Called when a dismissal attempt is blocked. */
  onClosePrevent?: () => void

  /** Called when Escape is pressed while the content is active. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void

  /** Called when focus moves outside the content and trigger. */
  onInteractOutside?: (event: PopperInteractOutsideEvent) => void

  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void

  /** Called when a pointer press starts outside the content and trigger. */
  onPointerDownOutside?: (event: PointerEvent) => void

  /** Called when the trigger loses focus. */
  onTriggerBlur?: (controls: PopperControls) => void

  /** Called when the trigger receives focus. */
  onTriggerFocus?: (controls: PopperControls) => void

  /** Called when the pointer enters the trigger. */
  onTriggerPointerEnter?: (controls: PopperControls, event: PointerEvent) => void

  /** Called when the pointer leaves the trigger. */
  onTriggerPointerLeave?: (controls: PopperControls, event: PointerEvent) => void

  /** Called when the positioned content loses focus. */
  onContentBlur?: (controls: PopperControls) => void

  /** Called when the positioned content receives focus. */
  onContentFocus?: (controls: PopperControls) => void

  /** Called when the pointer enters the positioned content. */
  onContentPointerEnter?: (controls: PopperControls, event: PointerEvent) => void

  /** Called when the pointer leaves the positioned content. */
  onContentPointerLeave?: (controls: PopperControls, event: PointerEvent) => void

  /** Controlled open state. */
  open?: boolean

  /**
   * Whether the content may overlap its trigger while remaining inside the viewport.
   * @default false
   */
  overlap?: boolean

  /**
   * Padding in pixels between positioned content and the viewport boundary.
   * @default 4
   */
  overflowPadding?: number

  /**
   * Preferred content placement relative to the trigger.
   * @default 'bottom'
   */
  placement?: PopperPlacement

  /**
   * Whether body scroll should be locked while the content is present.
   * @default false
   */
  preventScroll?: boolean

  /**
   * Whether focus returns to the trigger after the content closes.
   * @default true
   */
  restoreFocusOnClose?: boolean

  /** Semantic role applied to the positioned content. */
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']

  /**
   * Whether the content width should match the trigger width.
   * @default false
   */
  sameWidth?: boolean

  /**
   * Cross-axis offset in pixels from the resolved placement.
   * @default 0
   */
  shift?: number

  /**
   * Whether the content may slide along its main axis to remain visible.
   * @default true
   */
  slide?: boolean

  /**
   * Whether clicking the trigger toggles the open state.
   * @default true
   */
  toggleOnClick?: boolean

  /** Composed trigger and content primitives. */
  children?: JSX.Element
}

export interface PopperTriggerProps {
  /** Render the popper trigger as a single HTMLElement root. */
  children?: (props: OverlayTriggerProps) => JSX.Element

  /** Root props forwarded by a public popper wrapper. */
  triggerProps?: Partial<OverlayTriggerProps>

  /** Whether the trigger should reference the content with `aria-describedby`. */
  describeTrigger?: boolean

  /** Whether clicking the trigger toggles the open state. */
  toggleOnClick?: boolean
}

export interface PopperContentComponentProps {
  /** Component or element rendered inside the positioned content. */
  contentRender: ComponentOrElement<PopperContentContext>

  /** Class applied to the positioning wrapper. */
  positionerClass?: string

  /** Style applied to the positioning wrapper. */
  positionerStyle?: JSX.CSSProperties
}

export interface PopperContentContext {
  /** Closes the positioned content. */
  close: () => void

  /** Attributes and event handlers to forward to the content root. */
  contentProps: PopperContentProps

  /** Current placement after collision handling. */
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
      placement: 'bottom' as const,
      restoreFocusOnClose: true,
      sameWidth: false,
      shift: 0,
      slide: true,
      toggleOnClick: true,
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
  const contentPresence = useTransitionPresence({ open: isOpen })
  const contentMounted = createMemo(
    () => contentPresence.present() || (merged.forceMount && !merged.disabled),
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
  const userTriggerProps = (): Partial<OverlayTriggerProps> | undefined => props.triggerProps
  const triggerProps = mergeProps(
    {
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
    },
    untrack(userTriggerProps) ?? {},
    {
      ref: (element: HTMLElement | undefined) => {
        context.setTriggerElement(element)
        callRef(userTriggerProps()?.ref, element)
        if (element) {
          onCleanup(() => {
            if (context.triggerElement() === element) {
              context.setTriggerElement(undefined)
            }
            callRef(userTriggerProps()?.ref, undefined)
          })
        }
      },
      onBlur: (event: FocusEvent) => {
        callHandler<HTMLElement, FocusEvent>(event, userTriggerProps()?.onBlur)
        if (!event.defaultPrevented) {
          options.onTriggerBlur?.(context.getControls())
        }
      },
      onClick: (event: MouseEvent) => {
        callHandler<HTMLElement, MouseEvent>(event, userTriggerProps()?.onClick)
        if (!event.defaultPrevented && options.toggleOnClick) {
          context.getControls().toggle()
        }
      },
      onFocus: (event: FocusEvent) => {
        callHandler<HTMLElement, FocusEvent>(event, userTriggerProps()?.onFocus)
        if (!event.defaultPrevented) {
          options.onTriggerFocus?.(context.getControls())
        }
      },
      onPointerEnter: (event: PointerEvent) => {
        callHandler<HTMLElement, PointerEvent>(event, userTriggerProps()?.onPointerEnter)
        if (!event.defaultPrevented) {
          options.onTriggerPointerEnter?.(context.getControls(), event)
        }
      },
      onPointerLeave: (event: PointerEvent) => {
        callHandler<HTMLElement, PointerEvent>(event, userTriggerProps()?.onPointerLeave)
        if (!event.defaultPrevented) {
          options.onTriggerPointerLeave?.(context.getControls(), event)
        }
      },
    },
  ) as OverlayTriggerProps

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
    get 'data-closed'() {
      return context.contentPresence.dataAttrs()['data-closed']
    },
    get 'data-expanded'() {
      return context.contentPresence.dataAttrs()['data-expanded']
    },
  }

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
          class={cn(OVERLAY_POSITIONER_CLASS, 'z-floating', props.positionerClass)}
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
