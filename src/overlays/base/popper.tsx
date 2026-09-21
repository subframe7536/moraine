import type { Accessor, JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps,
  onCleanup,
  untrack,
} from 'solid-js'
import { Dynamic, Portal } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { callHandler, callRef, useId } from '../../shared/utils'

import { useFloatingPosition } from './floating'
import { useOverlayInteraction } from './interaction'
import type {
  PopperProps,
  PopperContentAttributes,
  PopperContentProps,
  PopperInteractOutsideEvent,
  PopperPointerDownOutsideEvent,
  PopperTriggerProps,
} from './popper.types'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusTrigger,
  trapFocusInContainer,
} from './utils'
export type * from './popper.types'

let popperTestPlacementAccessor: Accessor<string> | undefined

/** Preserve floating behavior while forwarding the surface's native ref and events. */
export function mergePopperElementProps<T extends HTMLElement>(
  internal: JSX.HTMLAttributes<T>,
  user: Record<string, unknown>,
  overrides: JSX.HTMLAttributes<T> = {},
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
  const contentProps = mergeProps(
    internal,
    user,
    handlers,
    {
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
    },
    overrides,
  )
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
  const isOpen = createMemo(() => open() && !props.disabled)
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
    'disabled',
    'children',
    'class',
    'style',
    'describeTrigger',
    'toggleOnClick',
    'ref' as any,
  ])
  const context = untrack(() => props.context)
  const tag = () => local.as ?? 'button'
  const disabled = () => Boolean(local.disabled || context.options.disabled)
  const interaction = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: context.triggerElement,
      tag,
      onPress: () => {
        if (local.toggleOnClick ?? true) {
          context.setOpen(!context.isOpen())
        }
      },
    },
    rest,
  )
  const binding = mergeProps(
    {
      get 'aria-haspopup'() {
        return local.describeTrigger ? undefined : true
      },
      get 'aria-controls'() {
        return !local.describeTrigger && context.contentPresence.present()
          ? context.contentId()
          : undefined
      },
      get 'aria-describedby'() {
        return local.describeTrigger && context.contentPresence.present()
          ? context.contentId()
          : undefined
      },
      get 'aria-expanded'() {
        return local.describeTrigger ? undefined : context.isOpen() ? 'true' : 'false'
      },
      get 'data-closed'() {
        return context.isOpen() ? undefined : ''
      },
      get 'data-disabled'() {
        return disabled() ? '' : undefined
      },
      get 'data-expanded'() {
        return context.isOpen() ? '' : undefined
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
        callRef(local.ref, element)
        onCleanup(() => {
          if (context.triggerElement() === element) {
            context.setTriggerElement(undefined)
          }
          callRef(local.ref, undefined)
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
  let restoreFocusAfterClose = true

  createEffect(
    on(context.isOpen, (open) => {
      if (open) {
        restoreFocusAfterClose = true
      }
    }),
  )

  createEffect(
    on(
      () => options.placement,
      (placement) => {
        setInternalCurrentPlacement(placement)
      },
    ),
  )

  createEffect(
    on(contentMounted, (mounted) => {
      if (!mounted) {
        setContentElement(undefined)
        setPositionerElement(undefined)
        setPositionerPositioned(false)
        contentPresence.setElement(undefined)
      }
    }),
  )

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

  createEffect(
    on([positionerElement, contentElement], ([positioner, content]) => {
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
            const contentZIndex =
              content.ownerDocument.defaultView?.getComputedStyle(content).zIndex
            if (contentZIndex && contentZIndex !== 'auto') {
              positioner.style.zIndex = contentZIndex
            }
          }
        })
      })
    }),
  )

  createEffect(
    on(contentPresence.present, (present) => {
      if (!present || typeof document === 'undefined') {
        return
      }
      const modal = options.modal
      const preventScroll = options.preventScroll

      createEffect(
        on([contentElement, positionerElement], ([currentContent, currentPositioner]) => {
          if (!currentContent || !currentPositioner) {
            return
          }
          const releaseScrollLock =
            modal || preventScroll ? acquireBodyScrollLock(currentContent) : undefined
          let active = true
          let releaseAriaHide: (() => void) | undefined
          if (modal) {
            queueMicrotask(() => {
              if (active && currentContent.isConnected) {
                releaseAriaHide = acquireAriaHideOutside(currentContent)
                focusContent(currentContent)
              }
            })
          }
          onCleanup(() => {
            active = false
            releaseAriaHide?.()
            releaseScrollLock?.()
          })
        }),
      )
    }),
  )

  useOverlayInteraction({
    enabled: contentPresence.present,
    contentElement,
    triggerElement,
    requireContent: true,
    onPointerOutside: (event) => {
      const interactEvent: PopperPointerDownOutsideEvent = {
        defaultPrevented: false,
        originalEvent: event,
        preventDefault() {
          this.defaultPrevented = true
        },
      }

      options.onPointerDownOutside?.(interactEvent)
      const nativeDefaultPrevented = event.defaultPrevented

      if (options.modal) {
        event.preventDefault()
      }

      if (nativeDefaultPrevented || interactEvent.defaultPrevented) {
        return
      }

      if (options.dismissible) {
        if (!options.modal) {
          restoreFocusAfterClose = false
        }
        setOpen(false)
        return
      }

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
        if (!options.modal) {
          restoreFocusAfterClose = false
        }
        setOpen(false)
        return
      }

      if (!options.dismissible) {
        options.onClosePrevent?.()

        if (options.modal) {
          event.preventDefault()
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
      if (options.restoreFocusOnClose && restoreFocusAfterClose && context.isTop()) {
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
        const content = resolveChildren(() =>
          renderComponentOrElement(props.children, {
            close: () => context.setOpen(false),
            contentProps,
            currentPlacement,
          }),
        )
        return (
          <Portal mount={triggerElement()?.ownerDocument.body}>
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
              {content()}
            </div>
          </Portal>
        )
      }}
    </Show>
  )
}
