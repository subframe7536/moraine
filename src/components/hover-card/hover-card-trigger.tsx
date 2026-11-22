import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { PopperTrigger, mergePopperElementProps } from '../shared/overlay/popper'
import type { createPopper } from '../shared/overlay/popper'
import type { PopperTriggerProps } from '../shared/overlay/popper.types'

import { useHoverCardContext } from './hover-card-context'
import { hoverCardRecipe } from './hover-card.recipe'
import type { HoverCardT } from './hover-card.types'

/**
 * Element that opens its `HoverCard` on pointer hover or keyboard focus and anchors the card to
 * itself; place it inside `HoverCard`. It renders an `a` by default, so give it an `href` and
 * compose it in prose; use `as` to render another element. Set `value` to tell `HoverCard.Content`
 * which trigger anchored the card when several triggers share one card.
 *
 * @example
 * ```tsx
 * import { HoverCard } from 'moraine'
 *
 * <HoverCard>
 *   <HoverCard.Trigger href="/u/alex.morgan" value="alex">
 *     @alex.morgan
 *   </HoverCard.Trigger>
 *   <HoverCard.Content>Author profile preview</HoverCard.Content>
 * </HoverCard>
 * ```
 */
export function HoverCardTrigger<T extends ValidComponent = 'a'>(
  props: HoverCardT.TriggerProps<T>,
): JSX.Element {
  const context = useHoverCardContext()!
  const [local, rest] = splitProps(props, ['value'])
  const { slots } = useRecipe(hoverCardRecipe, props, {
    slot: 'trigger',
    context: () => context.slotOverrides,
  })
  const popper = context.popper
  // Hover and focus open the card outside the button interaction, so they check `disabled` here.
  const disabled = () => Boolean(props.disabled)
  const triggerProps = mergeProps(
    { as: 'a' as const },
    mergePopperElementProps<HTMLElement>(
      {
        onFocus: (event) => {
          const trigger = event.currentTarget
          let focusVisible = true
          try {
            focusVisible = trigger.matches(':focus-visible')
          } catch {
            // Engines without :focus-visible support still open on keyboard focus.
          }
          if (focusVisible && !disabled()) {
            context.activateTrigger(local.value, trigger)
            context.scheduleOpen(true)
          }
        },
        onBlur: () => {
          context.scheduleClose()
        },
        onPointerEnter: (event) => {
          if ((event.pointerType === 'mouse' || !event.pointerType) && !disabled()) {
            context.activateTrigger(local.value, event.currentTarget)
            context.recordPoint(event.clientX, event.clientY)
            context.scheduleOpen()
          }
        },
        onPointerLeave: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
            context.scheduleClose()
          }
        },
      },
      rest,
    ),
    slots.trigger,
    { context: popper, toggleOnClick: false, ariaRelation: 'none' as const },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return <PopperTrigger<T> {...triggerProps} />
}
