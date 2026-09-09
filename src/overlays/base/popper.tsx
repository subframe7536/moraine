import type { Accessor, JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  onCleanup,
  untrack,
} from 'solid-js'
import { Dynamic, Portal } from 'solid-js/web'

import { useCn } from '../../shared/provider/cn-context.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'

import { useFloatingPosition } from './floating.ts'
import { useOverlayInteraction } from './interaction.ts'
import type {
  PopperProps,
  PopperContentAttributes,
  PopperContentProps,
  PopperInteractOutsideEvent,
  PopperTriggerProps,
} from './popper.types.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusTrigger,
  trapFocusInContainer,
} from './utils.ts'
export type * from './popper.types.ts'

let popperTestPlacementAccessor: Accessor<string> | undefined

/** Preserve floating behavior while forwarding the surface's native ref and events. */
export function mergePopperElementProps<T extends HTMLElement>(
  internal: JSX.HTMLAttributes<T>,
  user: Record<string, unknown>,
): JSX.HTMLAttributes<T> {
  const handlers: JSX.HTMLAttributes<T> = {}
  for (const key of [
    'onClick',
    'onPointerDown',
    'onBlur',
    'onFocus',
    'onKeyDown',
    'onPointerEnter',
    'onPointerLeave',
  ] as const) {
    handlers[key] = (event: Event) => {
      callHandler(event, user[key])
      if (!event.defaultPrevented) {
        callHandler(event, internal[key])
      }
    }
  }
  const contentProps = mergeProps(internal, user, handlers, {
    ref: (element: T | undefined) => {
      if (!element) {
        return
      }
      callRef(internal.ref, element)
      callRef(user.ref, element)
      onCleanup(() => {
        if (typeof user.ref === 'function') {
          ;(user.ref as (element: T | undefined) => void)(undefined)
        }
      })
    },
  })
  return contentProps as JSX.HTMLAttributes<T>
}

interface PopperContext {
  options: PopperProps
  contentId: Accessor<string>
  isOpen: Accessor<boolean>
  setOpen: (open: boolean) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentPresence: ReturnType<typeof useTransitionPresence>
}

export function setPopperTestPlacementAccessor(accessor: Accessor<string> | undefined): void {
  popperTestPlacementAccessor = accessor
}

/** Creates shared state for positioned overlay primitives in the current owner. */
export function createPopper(props: PopperProps): PopperContext {
  const rootId = useId(() => props.id, 'popper')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setControlledOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(open()) && !props.disabled)
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const contentPresence = useTransitionPresence({ open: isOpen })

  function setOpen(nextOpen: boolean): void {
    if (props.disabled || nextOpen === isOpen()) {
      return
    }

    setControlledOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  return {
    options: props,
    contentId,
    isOpen,
    setOpen,
    contentElement,
    setContentElement,
    triggerElement,
    setTriggerElement,
    contentPresence,
  }
}

export function PopperTrigger<T extends ValidComponent = 'button'>(
  props: PopperTriggerProps<T> & { context: PopperContext },
): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'context',
    'as',
    'type',
    'disabled',
    'children',
    'class',
    'style',
    'describeTrigger',
    'toggleOnClick',
  ])
  const context = untrack(() => props.context)
  const tag = () => (local.as as ValidComponent) ?? 'button'
  const disabled = () => Boolean(local.disabled || context.options.disabled)
  const interaction = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      tag,
      type: () => local.type,
      typeForComponent: true,
      onPress: () =>
        (local.toggleOnClick ?? true) ? () => context.setOpen(!context.isOpen()) : undefined,
    },
    rest,
  )
  const binding = mergeProps(
    {
      'aria-haspopup': true,
      get 'aria-controls'() {
        return context.contentPresence.present() ? context.contentId() : undefined
      },
      get 'aria-describedby'() {
        return local.describeTrigger && context.contentPresence.present()
          ? context.contentId()
          : undefined
      },
      get 'aria-expanded'() {
        return context.isOpen() ? 'true' : 'false'
      },
      'data-slot': 'trigger',
    },
    interaction,
  )
  const children = resolveChildren(() => local.children)
  return (
    <Dynamic
      {...binding}
      component={tag()}
      class={cn(local.class)}
      style={local.style}
      ref={(element: HTMLElement) => {
        context.setTriggerElement(element)
        callRef(rest.ref, element)
        onCleanup(() => {
          if (context.triggerElement() === element) {
            context.setTriggerElement(undefined)
          }
          callRef(rest.ref, undefined)
        })
      }}
    >
      {children()}
    </Dynamic>
  )
}

export function PopperContent(props: PopperContentProps & { context: PopperContext }): JSX.Element {
  const cn = useCn()
  const context = untrack(() => props.context)
  const options = mergeProps(
    {
      closeOnOutsideFocus: true,
      detachedPadding: 0,
      dismissible: true,
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
    },
    props,
  )
  const { contentId, contentElement, setContentElement, triggerElement, contentPresence, setOpen } =
    context
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>()
  const [positionerPositioned, setPositionerPositioned] = createSignal(false)
  const [internalCurrentPlacement, setInternalCurrentPlacement] = createSignal<string>('bottom')
  const currentPlacement = createMemo(
    () => popperTestPlacementAccessor?.() ?? internalCurrentPlacement(),
  )
  const contentMounted = createMemo(
    () => contentPresence.present() || (options.forceMount && !context.options.disabled),
  )

  createEffect(() => {
    setInternalCurrentPlacement(options.placement)
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
    detachedPadding: () => options.detachedPadding,
    deferPositioned: true,
    fitViewport: () => options.fitViewport,
    floatingElement: positionerElement,
    flip: () => options.flip,
    getReferenceElement: triggerElement,
    gutter: () => options.gutter,
    hideWhenDetached: () => options.hideWhenDetached,
    onPlacementChange: setInternalCurrentPlacement,
    onPositionedChange: setPositionerPositioned,
    open: contentPresence.present,
    overlap: () => options.overlap,
    overflowPadding: () => options.overflowPadding,
    placement: () => options.placement,
    sameWidth: () => options.sameWidth,
    shift: () => options.shift,
    slide: () => options.slide,
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
      options.modal || options.preventScroll ? acquireBodyScrollLock() : undefined
    let active = true
    let releaseAriaHide: (() => void) | undefined
    if (options.modal) {
      queueMicrotask(() => {
        if (active && currentContent.isConnected) {
          releaseAriaHide = acquireAriaHideOutside(currentContent)
        }
      })
    }

    if (options.modal) {
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
      options.onPointerDownOutside?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (options.dismissible) {
        event.preventDefault()
        setOpen(false)
        return
      }

      event.preventDefault()
      options.onClosePrevent?.()
    },
    onFocusOutside: (event) => {
      const interactEvent: PopperInteractOutsideEvent = {
        defaultPrevented: false,
        originalEvent: event,
        preventDefault() {
          this.defaultPrevented = true
        },
      }

      options.onInteractOutside?.(interactEvent)

      if (interactEvent.defaultPrevented) {
        return
      }

      if (options.closeOnOutsideFocus && options.dismissible) {
        setOpen(false)
        return
      }

      if (!options.dismissible) {
        event.preventDefault()
        options.onClosePrevent?.()

        if (options.modal) {
          const currentContent = contentElement()
          queueMicrotask(() => {
            focusContent(currentContent)
          })
        }
      }
    },
    onEscape: (event) => {
      options.onEscapeKeyDown?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (options.dismissible) {
        event.preventDefault()
        setOpen(false)
        return
      }

      event.preventDefault()
      options.onClosePrevent?.()
    },
    onDeactivate: (context) => {
      // Restore focus while this entry is still topmost so lower overlays
      // treat the resulting focus event as owned by the closing layer.
      if (options.restoreFocusOnClose && context.isTop()) {
        focusTrigger(triggerElement())
      }
    },
  })

  const onContentKeyDown = (event: KeyboardEvent): void => {
    if (options.modal) {
      trapFocusInContainer(event, context.contentElement())
    }
  }

  const contentProps: PopperContentAttributes = {
    get 'aria-describedby'() {
      return options.ariaDescribedBy
    },
    get 'aria-labelledby'() {
      return options.ariaLabelledBy
    },
    get 'aria-modal'() {
      return options.modal ? true : undefined
    },
    get id() {
      return contentId()
    },
    onKeyDown: onContentKeyDown,
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
    get role() {
      return options.role
    },
    tabIndex: -1,
    get 'data-closed'() {
      return context.contentPresence.dataAttrs()['data-closed']
    },
    get 'data-expanded'() {
      return context.contentPresence.dataAttrs()['data-expanded']
    },
  }

  return (
    <Show when={contentMounted()}>
      {(_present) => {
        const children = resolveChildren(() => props.children as JSX.Element)
        return (
          <Portal>
            <div
              ref={(element) => {
                setPositionerElement(element)
                onCleanup(() => {
                  if (positionerElement() === element) {
                    setPositionerElement(undefined)
                  }
                })
              }}
              data-slot="positioner"
              data-positioned={positionerPositioned() ? '' : undefined}
              style={{ visibility: 'hidden', ...props.positionerStyle }}
              class={cn('left-0 top-0 absolute', props.positionerClass)}
            >
              {renderComponentOrElement(children() as PopperContentProps['children'], {
                close: () => context.setOpen(false),
                contentProps,
                currentPlacement,
              })}
            </div>
          </Portal>
        )
      }}
    </Show>
  )
}
