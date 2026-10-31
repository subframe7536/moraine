import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
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

export function TooltipContent(props: TooltipT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'text',
    'kbds',
    'kbdVariant',
    'children',
    'class',
    'style',
  ])

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
  } = useRecipe(tooltipRecipe, local, {
    slot: 'content',
    context: () => ({ variants: { invert: behavior.options.invert }, ...behavior.slotOverrides }),
  })
  return (
    <PopperContent
      context={behavior.popper}
      align={behavior.options.align}
      placement={behavior.options.placement ?? 'top'}
      forceMount={behavior.options.forceMount}
      initialPosition={behavior.initialPosition()}
      overflowPadding={4}
      role="tooltip"
      restoreFocusOnClose={false}
      positionerClass={
        behavior.instantMotion() ? TOOLTIP_INSTANT_POSITIONER_CLASS : TOOLTIP_POSITIONER_CLASS
      }
    >
      {(context) => {
        const contentProps = mergeProps(context.contentProps, contentEvents)
        const explicitText = createMemo(() => local.text)
        const text = createMemo(() => {
          const value = explicitText()
          return value === undefined ? resolveChildren(() => local.children)() : value
        })
        const kbds = createMemo(() => local.kbds)
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
                  variant={local.kbdVariant ?? (variants.invert ? 'invert' : undefined)}
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
