import type { JSX } from 'solid-js'
import { children as resolveChildren, mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { parseFloatingPlacement } from '../shared/overlay/placement'
import { PopperContent, mergePopperElementProps } from '../shared/overlay/popper'

import { useHoverCardContext } from './hover-card-context'
import { hoverCardContentDataAttributes, hoverCardRecipe } from './hover-card.recipe'
import type { HoverCardT } from './hover-card.types'

export function HoverCardContent(props: HoverCardT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])

  const behavior = useHoverCardContext()!
  const contentEvents: JSX.HTMLAttributes<HTMLDivElement> = {
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse' || !event.pointerType) {
        behavior.cancelClose()
      }
    },
    onPointerLeave: (event) => {
      if ((event.pointerType === 'mouse' || !event.pointerType) && behavior.openedByTrigger()) {
        behavior.scheduleClose()
      }
    },
  }
  const { slotWith } = useRecipe(hoverCardRecipe, local, {
    slot: 'content',
    context: () => behavior.slotOverrides,
  })
  return (
    <PopperContent
      context={behavior.popper}
      align={behavior.options.align}
      placement={behavior.options.placement ?? 'bottom'}
      forceMount={behavior.options.forceMount}
      gutter={behavior.options.gutter}
      shift={behavior.options.shift}
      flip={behavior.options.flip}
      slide={behavior.options.slide}
      overflowPadding={behavior.options.overflowPadding}
      inline={behavior.inlinePoint()}
      restoreFocusOnClose={false}
      closeOnOutsideFocus={false}
      onEscapeKeyDown={behavior.markInstantClose}
      onPointerDownOutside={behavior.markInstantClose}
    >
      {(context) => {
        const contentProps = mergeProps(context.contentProps, contentEvents)
        const content = resolveChildren(() =>
          typeof local.children === 'function'
            ? local.children({ value: behavior.activeValue })
            : local.children,
        )
        const contentSlot = slotWith('content', {
          data: hoverCardContentDataAttributes({
            side: () => parseFloatingPlacement(context.currentPlacement()).side,
            align: () => parseFloatingPlacement(context.currentPlacement()).align,
            instantMotion: behavior.instantMotion,
          }),
        })
        return (
          <div
            data-slot="hover-card-content"
            {...contentSlot}
            {...mergePopperElementProps(contentProps, rest)}
          >
            {content()}
          </div>
        )
      }}
    </PopperContent>
  )
}
