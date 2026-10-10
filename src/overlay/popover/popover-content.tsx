import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, mergeProps, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { hasJsxContent } from '../../shared/jsx-content'
import { parseFloatingPlacement } from '../base/placement'
import { PopperContent, mergePopperElementProps } from '../base/popper'
import { getFocusableElements } from '../base/utils'

import { usePopoverContext } from './popover-context'
import { popoverContentDataAttributes, popoverRecipe } from './popover.recipe'
import type { PopoverT } from './popover.types'

export function PopoverContent(props: PopoverT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ariaLabel',
    'children',
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
      if (behavior.options.mode === 'hover') {
        behavior.clearCloseTimer()
      }
    },
    onBlur: behavior.scheduleClose,
    onKeyDown: (event) => {
      if (behavior.options.mode !== 'hover' || event.key !== 'Tab') {
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
      if (behavior.options.mode === 'hover' && event.pointerType === 'mouse') {
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
      dir={rest.dir}
      context={behavior.popper}
      closeOnOutsideFocus={behavior.options.mode === 'click'}
      align={behavior.options.align}
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
          side: () => parseFloatingPlacement(context.currentPlacement()).side,
          align: () => parseFloatingPlacement(context.currentPlacement()).align,
        })
        return (
          <div
            data-slot="popover-content"
            {...contentDataAttrs}
            {...mergePopperElementProps(contentProps, rest)}
            aria-label={local.ariaLabel ?? rest['aria-label']}
            {...resolved.styles.content}
          >
            <Show when={hasJsxContent(content())}>
              <div data-slot="popover-body" {...resolved.styles.body}>
                {content()}
              </div>
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}
