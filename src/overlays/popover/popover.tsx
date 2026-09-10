import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  createEffect,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { hasJsxContent } from '../../shared/jsx-content'
import { createComponentStyles } from '../../shared/provider'
import { resolveOverlayMenuSide } from '../base'
import { createPopper, PopperTrigger, PopperContent, mergePopperElementProps } from '../base/popper'
import type { PopperTriggerProps } from '../base/popper.types'

import type { PopoverProps, PopoverT } from './popover.types'

const [PopoverProvider, usePopoverContext] = createContextProvider<{
  options: PopoverProps
  popper: ReturnType<typeof createPopper>
  mode: () => PopoverT.Props['mode']
  scheduleOpen: () => void
  scheduleClose: () => void
  clearCloseTimer: () => void
  invalidateHoverTimers: () => void
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

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimerVersion = 0
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
  }
  return <PopoverProvider value={behavior}>{merged.children}</PopoverProvider>
}

function PopoverTrigger<T extends ValidComponent = 'button'>(
  props: PopoverT.TriggerProps<T>,
): JSX.Element {
  const context = usePopoverContext()
  const resolved = createComponentStyles('popover', props, { rootSlot: 'trigger' })
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
    ),
    resolved.root,
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
  const resolved = createComponentStyles('popover', local, { rootSlot: 'content' })

  return (
    <PopperContent
      context={behavior.popper}
      closeOnOutsideFocus={behavior.mode() === 'click'}
      placement={behavior.options.placement}
      forceMount={behavior.options.forceMount}
      modal={behavior.options.modal}
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
        return (
          <div
            {...mergePopperElementProps(contentProps, rest)}
            data-slot="content"
            data-side={resolveOverlayMenuSide(context.currentPlacement() || local.side || 'bottom')}
            aria-label={local.ariaLabel ?? rest['aria-label']}
            {...resolved.root}
          >
            <Show when={hasJsxContent(content())}>
              <div data-slot="body" {...resolved.slot('body')}>
                {content()}
              </div>
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
