import type { JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { ValidComponent } from '../../shared/types'
import { focusContent, getFocusableElements } from '../shared/overlay/focus'
import { PopperTrigger, mergePopperElementProps } from '../shared/overlay/popper'
import type { createPopper } from '../shared/overlay/popper'
import type { PopperTriggerProps } from '../shared/overlay/popper.types'

import { usePopoverContext } from './popover-context'
import { popoverRecipe } from './popover.recipe'
import type { PopoverT } from './popover.types'

/**
 * Element that toggles the surrounding `Popover` and anchors its content. It must be placed
 * inside `Popover`. Renders a `button`; pass `as` to render another component such as `Button`.
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
export function PopoverTrigger<T extends ValidComponent = 'button'>(
  props: PopoverT.TriggerProps<T>,
): JSX.Element {
  const context = usePopoverContext()
  const { slots } = useRecipe(popoverRecipe, props, {
    slot: 'trigger',
    context: () => context.slotOverrides,
  })
  const popper = context.popper
  // Hover and focus open the popover outside the button interaction, so they check `disabled` here.
  const disabled = () => Boolean(props.disabled)
  const triggerProps = mergeProps(
    mergePopperElementProps<HTMLElement>(
      {
        onClick: () => {
          if (context.options.openOnHover) {
            context.invalidateHoverTimers()
            if (!popper.isOpen()) {
              popper.setOpen(true)
            }
          }
        },
        onFocus: () => {
          if (!disabled()) {
            context.scheduleOpen()
          }
        },
        onBlur: context.scheduleClose,
        onKeyDown: createKeyDownHandler({
          keys: {
            Tab: {
              when: (event) => {
                if (!context.options.openOnHover || event.shiftKey || !popper.isOpen()) {
                  return false
                }
                const content = popper.contentElement()
                return Boolean(content && getFocusableElements(content).length > 0)
              },
              handle: () => {
                const content = popper.contentElement()
                if (content) {
                  focusContent(content)
                  context.clearCloseTimer()
                }
              },
            },
          },
        }),
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse' && !disabled()) {
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
    slots.trigger,
    {
      context: popper,
      get toggleOnClick() {
        return !context.options.openOnHover
      },
    },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return <PopperTrigger<T> {...triggerProps} />
}
