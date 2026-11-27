import type { JSX } from '@solidjs/web'
import { Show, merge, onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { hasContent } from '../../shared/jsx-content'
import { createKeyDownHandler } from '../../shared/keyboard'
import { resolvePropsChildren } from '../../shared/utils'
import { getFocusableElements } from '../shared/overlay/focus'
import { parseFloatingPlacement } from '../shared/overlay/placement'
import { PopperContent, mergePopperElementProps } from '../shared/overlay/popper'

import { usePopoverContext } from './popover-context'
import { popoverContentDataAttributes, popoverRecipe } from './popover.recipe'
import type { PopoverT } from './popover.types'
/**
 * Floating panel of the surrounding `Popover`, shown next to its `Popover.Trigger` while the
 * popover is open. It must be placed inside `Popover`. Renders a `div` with `role="dialog"`
 * wrapping its children.
 *
 * @example
 * ```tsx
 * import { Button, Popover } from 'moraine'
 *
 * <Popover>
 *   <Popover.Trigger as={Button}>Details</Popover.Trigger>
 *   <Popover.Content>More information</Popover.Content>
 * </Popover>
 * ```
 */
export function PopoverContent(props: PopoverT.ContentProps): JSX.Element {
  const rest = omit(props, 'children', 'class', 'style')
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(resetTimeout))
  const behavior = usePopoverContext()
  const contentEvents: JSX.HTMLAttributes<HTMLDivElement> = {
    onFocus: () => {
      if (behavior.options.openOnHover) {
        behavior.clearCloseTimer()
      }
    },
    onBlur: behavior.scheduleClose,
    onKeyDown: createKeyDownHandler<HTMLDivElement>({
      disabled: () => !behavior.options.openOnHover,
      keys: {
        Tab: {
          preventDefault: false,
          handle: (event) => {
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
        },
      },
    }),
    onPointerEnter: (event) => {
      if (behavior.options.openOnHover && event.pointerType === 'mouse') {
        behavior.clearCloseTimer()
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse') {
        behavior.scheduleClose()
      }
    },
  }
  const {
    slots: { body: bodySlot },
    slotWith,
  } = useRecipe(popoverRecipe, props, {
    slot: 'content',
    context: () => behavior.slotOverrides,
  })

  return (
    <PopperContent
      dir={rest.dir}
      context={behavior.popper}
      closeOnOutsideFocus={!behavior.options.openOnHover}
      finalFocus={behavior.options.finalFocus ?? (behavior.options.openOnHover ? false : undefined)}
      role="dialog"
      onPointerDownOutside={(event) => {
        if (behavior.options.closeOnOutsideClick ?? true) {
          return
        }

        event.preventDefault()
        hasPreventedPointerAttempt = true
        clearTimeout(resetTimeout)
        resetTimeout = setTimeout(() => {
          hasPreventedPointerAttempt = false
          resetTimeout = undefined
        }, 0)
        behavior.options.onClosePrevented?.()
      }}
      onInteractOutside={(event) => {
        if ((behavior.options.closeOnOutsideClick ?? true) || event.defaultPrevented) {
          return
        }

        event.preventDefault()

        if (!hasPreventedPointerAttempt) {
          behavior.options.onClosePrevented?.()
        }
      }}
      onEscapeKeyDown={(event) => {
        if (behavior.options.closeOnEscape ?? true) {
          return
        }

        event.preventDefault()
        behavior.options.onClosePrevented?.()
      }}
    >
      {(context) => {
        const contentProps = merge(context.contentProps, contentEvents)
        const content = resolvePropsChildren(props)
        const contentSlot = slotWith('content', {
          data: popoverContentDataAttributes({
            side: () => parseFloatingPlacement(context.currentPlacement()).side,
            align: () => parseFloatingPlacement(context.currentPlacement()).align,
          }),
        })
        return (
          <div
            data-slot="popover-content"
            {...contentSlot}
            {...mergePopperElementProps(contentProps, rest)}
          >
            <Show when={hasContent(content())}>
              <div data-slot="popover-body" {...bodySlot}>
                {content()}
              </div>
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}
