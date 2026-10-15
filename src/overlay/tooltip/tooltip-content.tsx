import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'

import { KbdGroup } from '../../element/kbd-group'
import { useRecipe } from '../../provider'
import { parseFloatingPlacement } from '../base/placement'
import { PopperContent, mergePopperElementProps } from '../base/popper'

import { useTooltipContext } from './tooltip-context'
import {
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
  const { slots, variants } = useRecipe(tooltipRecipe, local, {
    slot: 'content',
    contextSlots: () => behavior.slotOverrides,
    contextVariants: () => ({ invert: behavior.options.invert }),
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
      positionerClass={TOOLTIP_POSITIONER_CLASS}
    >
      {(context) => {
        const contentProps = mergeProps(context.contentProps, contentEvents)
        const explicitText = createMemo(() => local.text)
        const text = createMemo(() => {
          const value = explicitText()
          return value === undefined ? resolveChildren(() => local.children)() : value
        })
        const kbds = createMemo(() => local.kbds)
        return (
          <div
            data-slot="tooltip-content"
            {...tooltipContentDataAttributes({
              side: () => parseFloatingPlacement(context.currentPlacement()).side,
              align: () => parseFloatingPlacement(context.currentPlacement()).align,
              instantMotion: behavior.instantMotion,
            })}
            {...mergePopperElementProps(contentProps, rest)}
            {...slots.content}
          >
            <Show when={typeof text() === 'string'} fallback={text()}>
              <span data-slot="tooltip-text" {...slots.text}>
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
                  {...slots.kbds}
                />
              )}
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}
