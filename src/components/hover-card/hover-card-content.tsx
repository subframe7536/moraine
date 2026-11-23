import type { JSX } from '@solidjs/web'
import { children as resolveChildren, merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'
import { parseFloatingPlacement } from '../shared/overlay/placement'
import { PopperContent, mergePopperElementProps } from '../shared/overlay/popper'

import { useHoverCardContext } from './hover-card-context'
import { hoverCardContentDataAttributes, hoverCardRecipe } from './hover-card.recipe'
import type { HoverCardT } from './hover-card.types'
/**
 * Floating `div` shown next to the trigger while a `HoverCard` is open; place it inside
 * `HoverCard`. It stays open while the pointer moves from the trigger into it. Children may be a
 * function that receives `{ value }`, the accessor for the `value` of the `HoverCard.Trigger` that
 * anchored the card, so several triggers can share one card.
 *
 * @example
 * ```tsx
 * import { HoverCard } from 'moraine'
 *
 * <HoverCard>
 *   <HoverCard.Trigger href="/u/alex" value="alex">
 *     @alex
 *   </HoverCard.Trigger>
 *   <HoverCard.Trigger href="/u/sam" value="sam">
 *     @sam
 *   </HoverCard.Trigger>
 *   <HoverCard.Content>{({ value }) => <p>Profile of {value()}</p>}</HoverCard.Content>
 * </HoverCard>
 * ```
 */
export function HoverCardContent(props: HoverCardT.ContentProps): JSX.Element {
  const local = pick(props, 'children', 'class', 'style')
  const rest = omit(props, 'children', 'class', 'style')

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
      finalFocus={false}
      closeOnOutsideFocus={false}
      onEscapeKeyDown={behavior.markInstantClose}
      onPointerDownOutside={behavior.markInstantClose}
    >
      {(context) => {
        const contentProps = merge(context.contentProps, contentEvents)
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
