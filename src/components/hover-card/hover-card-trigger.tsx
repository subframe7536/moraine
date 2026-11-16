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
          if (focusVisible) {
            context.activateTrigger(local.value, trigger)
            context.scheduleOpen(true)
          }
        },
        onBlur: () => {
          context.scheduleClose()
        },
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
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
