import type { JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { PopperTrigger, mergePopperElementProps } from '../shared/overlay/popper'
import type { createPopper } from '../shared/overlay/popper'
import type { PopperTriggerProps } from '../shared/overlay/popper.types'

import { useTooltipContext } from './tooltip-context'
import { tooltipRecipe } from './tooltip.recipe'
import type { TooltipT } from './tooltip.types'

/**
 * Element that the surrounding `Tooltip` is anchored to; it opens the tooltip on pointer hover
 * and keyboard focus, and pressing it dismisses the tooltip. Renders a `button`; pass `as` to
 * render another component such as `Button`. The trigger needs its own accessible name, for
 * example visible text or `aria-label`.
 *
 * @example
 * ```tsx
 * import { Button, Tooltip } from 'moraine'
 *
 * <Tooltip>
 *   <Tooltip.Trigger as={Button} variant="outline">
 *     Deploy History
 *   </Tooltip.Trigger>
 *   <Tooltip.Content>View project deployment history and logs</Tooltip.Content>
 * </Tooltip>
 * ```
 */
export function TooltipTrigger<T extends ValidComponent = 'button'>(
  props: TooltipT.TriggerProps<T>,
): JSX.Element {
  const context = useTooltipContext()
  const { slots } = useRecipe(tooltipRecipe, props, {
    slot: 'trigger',
    context: () => context.slotOverrides,
  })
  const popper = context.popper
  // Hover and focus open the tooltip outside the button interaction, so they check `disabled` here.
  const disabled = () => Boolean(props.disabled)
  const triggerProps = mergeProps(
    mergePopperElementProps<HTMLElement>(
      {
        onPointerDown: context.dismiss,
        onClick: context.dismiss,
        onFocus: () => {
          if (!disabled()) {
            context.scheduleOpen(true)
          }
        },
        onBlur: () => {
          context.resetPress()
          context.scheduleClose()
        },
        onPointerEnter: (event) => {
          if ((event.pointerType === 'mouse' || !event.pointerType) && !disabled()) {
            context.resetPress()
            context.scheduleOpen()
          }
        },
        onPointerLeave: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
            context.scheduleClose()
          }
        },
      },
      props,
    ),
    slots.trigger,
    { context: popper, toggleOnClick: false, ariaRelation: 'description' },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return <PopperTrigger<T> {...triggerProps} />
}
