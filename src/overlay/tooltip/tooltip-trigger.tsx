import type { JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { PopperTrigger, mergePopperElementProps } from '../base/popper'
import type { createPopper } from '../base/popper'
import type { PopperTriggerProps } from '../base/popper.types'

import { useTooltipContext } from './tooltip-context'
import { tooltipRecipe } from './tooltip.recipe'
import type { TooltipT } from './tooltip.types'

export function TooltipTrigger<T extends ValidComponent = 'button'>(
  props: TooltipT.TriggerProps<T>,
): JSX.Element {
  const context = useTooltipContext()
  const resolved = createStyles(tooltipRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const popper = context.popper
  const triggerProps = mergeProps(
    mergePopperElementProps<HTMLElement>(
      {
        onPointerDown: context.dismiss,
        onClick: context.dismiss,
        onFocus: () => context.scheduleOpen(true),
        onBlur: () => {
          context.resetPress()
          context.scheduleClose()
        },
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
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
    resolved.styles.trigger,
    { context: popper, toggleOnClick: false, describeTrigger: true },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return <PopperTrigger<T> {...triggerProps} />
}
