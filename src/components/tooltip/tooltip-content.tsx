import type { JSX } from '@solidjs/web'
import { Show, merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { resolvePropsChildren } from '../../shared/utils'
import { KbdGroup } from '../kbd-group'
import { parseFloatingPlacement } from '../shared/overlay/placement'
import { PopperContent, mergePopperElementProps } from '../shared/overlay/popper'

import { useTooltipContext } from './tooltip-context'
import {
  TOOLTIP_INSTANT_POSITIONER_CLASS,
  TOOLTIP_POSITIONER_CLASS,
  tooltipContentDataAttributes,
  tooltipRecipe,
} from './tooltip.recipe'
import type { TooltipT } from './tooltip.types'
/**
 * Floating panel of the surrounding `Tooltip`; renders a `div` with `role="tooltip"` in a
 * portaled positioner. Place it inside `Tooltip`, next to `Tooltip.Trigger`. String children
 * are rendered as text, other children render as given. `kbds` only displays shortcut keycaps
 * and does not register the shortcut; their style follows `kbdVariant` on the `Tooltip` root.
 *
 * @example
 * ```tsx
 * import { Button, Tooltip } from 'moraine'
 *
 * <Tooltip kbdVariant="outline">
 *   <Tooltip.Trigger as={Button}>Save</Tooltip.Trigger>
 *   <Tooltip.Content kbds={['command', 's']}>Save changes</Tooltip.Content>
 * </Tooltip>
 * ```
 */
export function TooltipContent(props: TooltipT.ContentProps): JSX.Element {
  const rest = omit(props, 'kbds', 'children', 'class', 'style')

  const behavior = useTooltipContext()
  const contentEvents: JSX.HTMLAttributes<HTMLDivElement> = {
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse' || !event.pointerType) {
        behavior.keepOpen()
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse' || !event.pointerType) {
        behavior.scheduleClose()
      }
    },
  }
  const {
    slots: { text: textSlot, kbds: kbdsSlot },
    slotWith,
    variants,
  } = useRecipe(tooltipRecipe, props, {
    slot: 'content',
    context: () => ({ variants: { variant: behavior.options.variant }, ...behavior.slotOverrides }),
  })
  return (
    <PopperContent
      context={behavior.popper}
      align={behavior.options.align}
      placement={behavior.options.placement ?? 'top'}
      forceMount={behavior.options.forceMount}
      initialPosition={behavior.initialPosition()}
      gutter={behavior.options.gutter ?? 4}
      shift={behavior.options.shift}
      flip={behavior.options.flip}
      slide={behavior.options.slide}
      overflowPadding={behavior.options.overflowPadding ?? 4}
      role="tooltip"
      finalFocus={false}
      positionerClass={
        behavior.instantMotion() ? TOOLTIP_INSTANT_POSITIONER_CLASS : TOOLTIP_POSITIONER_CLASS
      }
    >
      {(context) => {
        const contentProps = merge(context.contentProps, contentEvents)
        const text = resolvePropsChildren(props)
        const kbds = () => props.kbds
        const contentSlot = slotWith('content', {
          data: tooltipContentDataAttributes({
            side: () => parseFloatingPlacement(context.currentPlacement()).side,
            align: () => parseFloatingPlacement(context.currentPlacement()).align,
            instantMotion: behavior.instantMotion,
          }),
        })
        return (
          <div
            data-slot="tooltip-content"
            {...contentSlot}
            {...mergePopperElementProps(contentProps, rest)}
          >
            <Show when={typeof text() === 'string'} fallback={text()}>
              <span data-slot="tooltip-text" {...textSlot}>
                {text()}
              </span>
            </Show>
            <Show when={kbds()?.length ? kbds() : undefined}>
              {(keys) => (
                <KbdGroup
                  data-slot="tooltip-kbds"
                  variant={
                    behavior.options.kbdVariant ??
                    (variants.variant === 'invert' ? 'invert' : undefined)
                  }
                  size="sm"
                  items={keys()}
                  {...kbdsSlot}
                />
              )}
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}
