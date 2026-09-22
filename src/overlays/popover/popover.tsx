import type { Accessor, JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { createContextProvider } from '../../shared/create-context-provider'
import { hasJsxContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef } from '../../shared/utils'
import { resolveOverlayMenuSide } from '../base'
import { createPopper, PopperTrigger, PopperContent, mergePopperElementProps } from '../base/popper'
import type { PopperTriggerProps } from '../base/popper.types'
import { focusContent, getFocusableElements } from '../base/utils'

import { popoverContentDataAttributes, popoverRecipe } from './popover.recipe'
import type { PopoverProps, PopoverT } from './popover.types'

const [PopoverProvider, usePopoverContext] = createContextProvider<{
  options: PopoverProps
  popper: ReturnType<typeof createPopper>
  mode: () => PopoverT.Props['mode']
  scheduleOpen: () => void
  scheduleClose: () => void
  clearCloseTimer: () => void
  invalidateHoverTimers: () => void
  hasClose: () => boolean
  registerClose: () => () => void
  presentation: { classes?: PopoverT.Classes; styles?: PopoverT.Styles }
}>('Popover')

/** Click-triggered floating content panel anchored to a trigger element. */
export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: 'click' as const,
      openDelay: 100,
      closeDelay: 100,
    },
    props,
  )

  const popper = createPopper(merged)
  const [closeRegistrations, setCloseRegistrations] = createSignal<Set<number>>(new Set())
  const hasClose = createMemo(() => closeRegistrations().size > 0)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimerVersion = 0
  let nextCloseRegistrationId = 0
  let ownerAlive = true

  function clearOpenTimer(): void {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function invalidateHoverTimers(): void {
    hoverTimerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function scheduleOpen(): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()
    const version = ++hoverTimerVersion
    openTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      openTimer = undefined
      popper.setOpen(true)
    }, merged.openDelay)
  }

  function scheduleClose(): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    const version = ++hoverTimerVersion
    closeTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      closeTimer = undefined
      popper.setOpen(false)
    }, merged.closeDelay)
  }

  function registerClose(): () => void {
    const registrationId = nextCloseRegistrationId++
    let active = true
    setCloseRegistrations((current) => {
      const next = new Set(current)
      next.add(registrationId)
      return next
    })

    return () => {
      if (!active) {
        return
      }

      active = false
      setCloseRegistrations((current) => {
        const next = new Set(current)
        next.delete(registrationId)
        return next
      })
    }
  }

  createEffect(
    on([() => merged.mode, () => merged.disabled], () => {
      invalidateHoverTimers()
    }),
  )

  onCleanup(() => {
    ownerAlive = false
    invalidateHoverTimers()
  })

  const behavior: ReturnType<typeof usePopoverContext> = {
    options: merged,
    popper,
    mode: () => merged.mode,
    scheduleOpen,
    scheduleClose,
    clearCloseTimer,
    invalidateHoverTimers,
    hasClose,
    registerClose,
    get presentation() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <PopoverProvider value={behavior}>{merged.children}</PopoverProvider>
}

function PopoverTrigger<T extends ValidComponent = 'button'>(
  props: PopoverT.TriggerProps<T>,
): JSX.Element {
  const context = usePopoverContext()
  const resolved = createStyles(popoverRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const popper = context.popper
  const triggerProps = mergeProps(
    mergePopperElementProps<HTMLElement>(
      {
        onClick: () => {
          if (context.mode() === 'hover') {
            context.invalidateHoverTimers()
            if (!popper.isOpen()) {
              popper.setOpen(true)
            }
          }
        },
        onFocus: context.scheduleOpen,
        onBlur: context.scheduleClose,
        onKeyDown: (event) => {
          if (
            context.mode() !== 'hover' ||
            event.key !== 'Tab' ||
            event.shiftKey ||
            !popper.isOpen()
          ) {
            return
          }

          const content = popper.contentElement()
          if (!content || getFocusableElements(content).length === 0) {
            return
          }

          event.preventDefault()
          focusContent(content)
          context.clearCloseTimer()
        },
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse') {
            context.scheduleOpen()
          }
        },
        onPointerLeave: (event) => {
          if (event.pointerType === 'mouse') {
            context.scheduleClose()
          }
        },
      },
      props,
      { 'aria-haspopup': 'dialog' as const },
    ),
    resolved.styles.trigger,
    {
      context: popper,
      get toggleOnClick() {
        return context.mode() === 'click'
      },
    },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return createComponent(PopperTrigger<T>, triggerProps)
}

function PopoverContent(props: PopoverT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ariaLabel',
    'children',
    'side',
    'class',
    'style',
    'classes',
    'styles',
  ])
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(resetTimeout))
  const behavior = usePopoverContext()
  const contentEvents: JSX.HTMLAttributes<HTMLDivElement> = {
    onFocus: () => {
      if (behavior.mode() === 'hover') {
        behavior.clearCloseTimer()
      }
    },
    onBlur: behavior.scheduleClose,
    onKeyDown: (event) => {
      if (behavior.mode() !== 'hover' || event.key !== 'Tab') {
        return
      }

      const content = behavior.popper.contentElement()
      const focusable = content ? getFocusableElements(content) : []
      const firstFocusable = focusable[0]
      const lastFocusable = focusable.at(-1)

      if (event.shiftKey) {
        if (event.target !== content && event.target !== firstFocusable) {
          return
        }

        event.preventDefault()
        behavior.popper.triggerElement()?.focus()
        behavior.clearCloseTimer()
        return
      }

      if (event.target !== lastFocusable) {
        return
      }

      const trigger = behavior.popper.triggerElement()
      if (!trigger) {
        return
      }
      const documentOrder = getFocusableElements(trigger.ownerDocument.body)
      const triggerIndex = documentOrder.indexOf(trigger)
      if (triggerIndex < 0) {
        return
      }
      const nextFocusable = documentOrder
        .slice(triggerIndex + 1)
        .find((element) => !content?.contains(element))
      if (!nextFocusable) {
        return
      }

      event.preventDefault()
      nextFocusable.focus()
      behavior.scheduleClose()
    },
    onPointerEnter: (event) => {
      if (behavior.mode() === 'hover' && event.pointerType === 'mouse') {
        behavior.clearCloseTimer()
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse') {
        behavior.scheduleClose()
      }
    },
  }
  const resolved = createStyles(popoverRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => behavior.presentation,
  })

  return (
    <PopperContent
      context={behavior.popper}
      closeOnOutsideFocus={behavior.mode() === 'click'}
      placement={behavior.options.placement}
      forceMount={behavior.options.forceMount}
      modal={Boolean(behavior.options.modal && behavior.hasClose())}
      preventScroll={behavior.options.preventScroll}
      dismissible={behavior.options.dismissible}
      onClosePrevent={behavior.options.onClosePrevent}
      overflowPadding={4}
      role="dialog"
      onPointerDownOutside={(event) => {
        if (behavior.options.dismissible ?? true) {
          return
        }

        event.preventDefault()
        hasPreventedPointerAttempt = true
        clearTimeout(resetTimeout)
        resetTimeout = setTimeout(() => {
          hasPreventedPointerAttempt = false
          resetTimeout = undefined
        }, 0)
        behavior.options.onClosePrevent?.()
      }}
      onInteractOutside={(event) => {
        if ((behavior.options.dismissible ?? true) || event.defaultPrevented) {
          return
        }

        event.preventDefault()

        if (!hasPreventedPointerAttempt) {
          behavior.options.onClosePrevent?.()
        }
      }}
      onEscapeKeyDown={(event) => {
        if (behavior.options.dismissible ?? true) {
          return
        }

        event.preventDefault()
        behavior.options.onClosePrevent?.()
      }}
    >
      {(context) => {
        const contentProps = mergeProps(context.contentProps, contentEvents)
        const content = resolveChildren(() => local.children)
        const contentDataAttrs = popoverContentDataAttributes({
          side: () => resolveOverlayMenuSide(context.currentPlacement() || local.side || 'bottom'),
        })
        return (
          <div
            {...mergePopperElementProps(contentProps, rest)}
            data-slot="content"
            {...contentDataAttrs}
            aria-label={local.ariaLabel ?? rest['aria-label']}
            {...resolved.styles.content}
          >
            <Show when={hasJsxContent(content())}>
              <div data-slot="body" {...resolved.styles.body}>
                {content()}
              </div>
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}

/** Closes the current Popover and enables its modal accessibility behavior when composed in Content. */
function PopoverClose<T extends ValidComponent = 'button'>(
  props: PopoverT.CloseProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const cn = useCn()
  const behavior = usePopoverContext()
  const tag: Accessor<ValidComponent> = () => local.as ?? 'button'
  const [element, setElement] = createSignal<HTMLElement>()
  const interaction = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      element,
      onPress: () => behavior.popper.setOpen(false),
      tag,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)
  const unregisterClose = behavior.registerClose()
  onCleanup(unregisterClose)

  return (
    <Dynamic
      data-slot="close"
      {...interaction}
      component={tag()}
      class={cn(local.class)}
      style={local.style}
      ref={(nextElement: HTMLElement) => {
        setElement(nextElement)
        callRef(local.ref, nextElement)
        onCleanup(() => {
          if (element() === nextElement) {
            setElement(undefined)
          }
          callRef(local.ref, undefined)
        })
      }}
    >
      {children()}
    </Dynamic>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
Popover.Close = PopoverClose
