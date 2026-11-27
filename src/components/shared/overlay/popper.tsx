import type { Placement } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import { Portal, dynamic } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  omit,
  createRenderEffect,
} from 'solid-js'

import { useCn } from '../../../provider/cn-context'
import { useLocale } from '../../../provider/locale/locale-context'
import { createControllableValue } from '../../../shared/controllable-value'
import { createLazyMemo } from '../../../shared/create-lazy-memo'
import { createPolymorphicRoot } from '../../../shared/create-polymorphic-root'
import { renderWithProps } from '../../../shared/render-with-props'
import { createTransitionPresence } from '../../../shared/transition-presence'
import type { ValidComponent } from '../../../shared/types'
import { useButtonInteraction } from '../../../shared/use-button-interaction'
import {
  callHandler,
  callRef,
  createId,
  mergeDefinedProps,
  resolvePropsChildren,
  publishElement,
} from '../../../shared/utils'
import { dataSlotName } from '../../../theme/data-slot'

import { useFloatingPosition, usePositionerZIndex } from './floating'
import { focusTrigger, resolveFocusTarget } from './focus'
import { useOverlayInteraction } from './interaction'
import { resolveFloatingPlacement } from './placement'
import { popperDataAttributes } from './popper.recipe'
import type {
  PopperProps,
  PopperContentAttributes,
  PopperContentProps,
  PopperInteractOutsideEvent,
  PopperPointerDownOutsideEvent,
  PopperTriggerProps,
} from './popper.types'
import { acquireBodyScrollLock } from './scroll-lock'

// Composed refs are cached per (internal, user) pair so spread re-applications
// keep an identity-stable `ref` instead of re-invoking it on every merge eval.
const composedRefs = new WeakMap<object, WeakMap<object, (element: never) => void>>()

function composeElementRef<T extends HTMLElement>(
  internal: JSX.HTMLAttributes<T>,
  user: Record<string, unknown>,
): (element: T) => void {
  let inner = composedRefs.get(internal)
  if (!inner) {
    composedRefs.set(internal, (inner = new WeakMap()))
  }
  let composed = inner.get(user) as ((element: T) => void) | undefined
  if (!composed) {
    composed = (element: T) => {
      callRef(() => internal.ref, element)
      callRef(() => user.ref, element)
    }
    inner.set(user, composed)
  }
  return composed
}

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
  // Resolve the children getter through its own descriptor so spread
  // re-applications keep the mounted nodes instead of rebuilding the subtree.
  const children = Object.getOwnPropertyDescriptor(user, 'children')
    ? resolvePropsChildren(user)
    : undefined
  const contentProps = mergeDefinedProps(
    internal,
    user,
    handlers,
    {
      ref: composeElementRef(internal, user),
    },
    overrides,
    children === undefined ? {} : { children },
  )
  return contentProps as JSX.HTMLAttributes<T>
}

interface PopperContext {
  slotName: (slot: string) => string
  options: PopperProps
  contentId: Accessor<string>
  isOpen: Accessor<boolean>
  setOpen: (open: boolean) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentPresence: ReturnType<typeof createTransitionPresence>
}

type PopperTriggerState = Pick<
  PopperContext,
  'slotName' | 'contentId' | 'isOpen' | 'setOpen' | 'triggerElement' | 'setTriggerElement'
> & {
  options: Pick<PopperProps, 'disabled'>
  contentPresence: Pick<PopperContext['contentPresence'], 'present'>
}

type PopperContentState = Omit<PopperContext, 'setTriggerElement'>

/** Creates shared state for positioned overlay primitives in the current owner. */
export function createPopper(
  props: PopperProps,
  owner: 'popover' | 'tooltip' | 'hover-card',
): PopperContext {
  const rootId = createId(() => props.id, 'popper')
  const contentId = () => `${rootId()}-content`
  const [open, setControlledOpen] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const isOpen = createMemo(() => open() && !props.disabled)
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const contentPresence = createTransitionPresence({
    open: isOpen,
    onExitComplete: () => props.onExitComplete?.(),
  })

  function setOpen(nextOpen: boolean): void {
    // Outside dismissal and focus handlers run unowned; settle the write.
    if (!props.disabled) {
      setControlledOpen(nextOpen)
    }
  }

  return {
    slotName: (slot: string) => dataSlotName(owner, slot),
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
  props: PopperTriggerProps<T> & { context: PopperTriggerState },
): JSX.Element {
  const refKey = 'ref' as keyof (PopperTriggerProps<T> & { context: PopperTriggerState })
  const rest = omit(props, 'context', 'as', 'disabled', 'ariaRelation', 'toggleOnClick', refKey)
  const context = untrack(() => props.context)
  const tag = () => props.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: true,
    ref: () => (props as { ref?: (el: HTMLElement) => void }).ref,
    registration: { element: context.triggerElement, setElement: context.setTriggerElement },
  })
  const disabled = () => Boolean(props.disabled || context.options.disabled)
  const interaction = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      element: root.element,
      tag,
      onPress: () => {
        if (props.toggleOnClick ?? true) {
          context.setOpen(!context.isOpen())
        }
      },
    },
    rest,
  )
  const rootBinding = root.bind(interaction)
  // The trigger has no recipe slot: callers style it through `rest`, so the state stays a separate bag.
  // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- no recipe slot binding on this host
  const triggerData = popperDataAttributes.trigger({
    closed: () => !context.isOpen(),
    disabled,
    expanded: context.isOpen,
  })
  const Root = dynamic<ValidComponent>(tag)
  return (
    <Root
      data-slot={context.slotName('trigger')}
      {...triggerData}
      aria-haspopup={(props.ariaRelation ?? 'popup') === 'popup' ? 'true' : undefined}
      aria-controls={
        (props.ariaRelation ?? 'popup') === 'popup' && context.contentPresence.present()
          ? context.contentId()
          : undefined
      }
      aria-describedby={
        props.ariaRelation === 'description' && context.contentPresence.present()
          ? context.contentId()
          : undefined
      }
      aria-expanded={
        (props.ariaRelation ?? 'popup') === 'popup'
          ? context.isOpen()
            ? 'true'
            : 'false'
          : undefined
      }
      {...rootBinding}
    />
  )
}

export function PopperContent(
  props: PopperContentProps & { context: PopperContentState },
): JSX.Element {
  const cn = useCn()
  const direction = useLocale().dir
  const context = untrack(() => props.context)
  const options = mergeDefinedProps(
    {
      closeOnOutsideFocus: true,
      detachedPadding: 0,
      closeOnEscape: true,
      closeOnOutsideClick: true,
      fitViewport: false,
      flip: true,
      forceMount: false,
      gutter: 0,
      hideWhenDetached: false,
      overlap: false,
      overflowPadding: 4,
      placement: 'bottom' as const,
      align: 'center' as const,
      sameWidth: false,
      shift: 0,
      slide: true,
    },
    context.options,
    props,
  )
  const { contentId, contentElement, setContentElement, triggerElement, contentPresence, setOpen } =
    context
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>()
  const [positionerPositioned, setPositionerPositioned] = createSignal(false)
  const [currentPlacement, setCurrentPlacement] = createSignal<Placement>(() =>
    resolveFloatingPlacement(options.placement, options.align),
  )
  const [mount, setPortalMount] = createSignal<HTMLElement>()
  // Resolve after mounting, when the trigger may have been adopted into another document.
  createEffect(triggerElement, (trigger) => {
    setPortalMount(trigger?.ownerDocument.body)
  })
  const contentMounted = () =>
    contentPresence.present() || (options.forceMount && !context.options.disabled)
  let restoreFocusAfterClose = true

  createEffect(context.isOpen, (open) => {
    if (open) {
      restoreFocusAfterClose = true
    }
  })

  const [content, setContent] = createSignal<HTMLDivElement>()
  createRenderEffect(content, (element) => {
    if (!element) {
      return
    }
    const unpublish = publishElement(contentElement, setContentElement)(element)
    const release = contentPresence.registerElement(element)
    return () => {
      release()
      unpublish()
    }
  })

  createEffect(contentMounted, (mounted) => {
    if (!mounted) {
      setContent(undefined)
      setPositionerElement(undefined)
      setPositionerPositioned(false)
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
    initialPosition: () => props.initialPosition,
    inline: () => options.inline,
    onPlacementChange: setCurrentPlacement,
    onPositionedChange: setPositionerPositioned,
    open: contentPresence.present,
    overlap: () => options.overlap,
    overflowPadding: () => options.overflowPadding,
    placement: () => resolveFloatingPlacement(options.placement, options.align),
    sameWidth: () => options.sameWidth,
    shift: () => options.shift,
    slide: () => options.slide,
  })

  createEffect(
    () => [positionerElement(), positionerPositioned()] as const,
    ([positioner, positioned]) => {
      positioner?.toggleAttribute('data-positioned', positioned)
    },
  )

  usePositionerZIndex(positionerElement, contentElement)

  // `preventScroll` is latched when the open cycle starts so toggling it
  // mid-cycle does not release or acquire the lock.
  let activePreventScroll = false
  createEffect(
    () => [contentPresence.present(), options.preventScroll === true] as const,
    ([present, preventScroll], previous) => {
      if (present && !previous?.[0]) {
        activePreventScroll = preventScroll
      }
    },
  )

  createEffect(
    () => [contentPresence.present(), contentElement(), positionerElement()],
    ([present, currentContent, currentPositioner]) => {
      if (!present || !activePreventScroll || !currentContent || !currentPositioner) {
        return
      }
      const releaseScrollLock = acquireBodyScrollLock(currentContent)
      return () => {
        releaseScrollLock?.()
      }
    },
  )

  useOverlayInteraction({
    enabled: () => options.interactionEnabled ?? contentPresence.present(),
    containsTarget: (target) => options.containsTarget?.(target) ?? false,
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

      if (event.defaultPrevented || interactEvent.defaultPrevented) {
        return
      }

      if (options.closeOnOutsideClick) {
        restoreFocusAfterClose = false
        setOpen(false)
        return
      }

      options.onClosePrevented?.()
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

      if (options.closeOnOutsideFocus && options.closeOnOutsideClick) {
        restoreFocusAfterClose = false
        setOpen(false)
        return
      }

      if (!options.closeOnOutsideClick) {
        options.onClosePrevented?.()
      }
    },
    onEscape: (event) => {
      options.onEscapeKeyDown?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (options.closeOnEscape) {
        event.preventDefault()
        setOpen(false)
        return
      }

      event.preventDefault()
      options.onClosePrevented?.()
    },
    onDeactivate: (context) => {
      // Restore focus while this entry is still topmost so lower overlays
      // treat the resulting focus event as owned by the closing layer.
      const top = untrack(() => context.isTop())
      if (restoreFocusAfterClose && top) {
        // Reads inside disposal serve the reverting transaction's staged view;
        // `untrack` sees the committed element.
        focusTrigger(
          options.finalFocus === undefined
            ? untrack(triggerElement)
            : resolveFocusTarget(options.finalFocus),
        )
      }
    },
  })

  const contentProps = {
    get 'aria-describedby'() {
      return options.ariaDescribedBy
    },
    get 'aria-labelledby'() {
      return options.ariaLabelledBy
    },
    get id() {
      return contentId()
    },
    ref: setContent,
    get role() {
      return options.role
    },
    tabindex: -1,
  } as PopperContentAttributes
  Object.defineProperties(
    contentProps,
    Object.getOwnPropertyDescriptors(
      // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- contentProps is a render-prop bag, not a recipe slot binding
      popperDataAttributes.content({
        closed: () => !context.isOpen(),
        expanded: context.isOpen,
      }),
    ),
  )

  return (
    <Show when={contentMounted()}>
      {(_present) => {
        const child = resolvePropsChildren(props as { children?: JSX.Element })
        // Portals emit no SSR markup, so content resolution must stay lazy and run
        // inside the portal's post-hydration mount rather than during hydration.
        const content = createLazyMemo(() =>
          renderWithProps(child(), {
            close: () => context.setOpen(false),
            contentProps,
            currentPlacement,
            positioned: positionerPositioned,
            positionerElement,
          }),
        )
        return (
          <Portal mount={(options.mount ?? mount()) as Element}>
            <div
              ref={setPositionerElement}
              dir={props.dir ?? direction()}
              data-slot={context.slotName('positioner')}
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
