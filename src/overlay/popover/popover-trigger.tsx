import type { JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { PopperTrigger, mergePopperElementProps } from '../base/popper'
import type { createPopper } from '../base/popper'
import type { PopperTriggerProps } from '../base/popper.types'
import { focusContent, getFocusableElements } from '../base/utils'

import { usePopoverContext } from './popover-context'
import { popoverRecipe } from './popover.recipe'
import type { PopoverT } from './popover.types'

export function PopoverTrigger<T extends ValidComponent = 'button'>(
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
          if (context.options.mode === 'hover') {
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
            context.options.mode !== 'hover' ||
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
        return context.options.mode === 'click'
      },
    },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return <PopperTrigger<T> {...triggerProps} />
}
