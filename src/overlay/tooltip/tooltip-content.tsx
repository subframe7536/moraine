import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'

import { KbdGroup } from '../../element/kbd-group'
import { createStyles } from '../../provider'
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
    'invert',
    'class',
    'style',
    'classes',
    'styles',
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
  const resolved = createStyles(tooltipRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => behavior.presentation,
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
        const contentDataAttrs = tooltipContentDataAttributes({
          side: () => parseFloatingPlacement(context.currentPlacement()).side,
          align: () => parseFloatingPlacement(context.currentPlacement()).align,
          instantMotion: behavior.instantMotion,
        })
        return (
          <div
            {...mergePopperElementProps(contentProps, rest)}
            data-slot="tooltip-content"
            {...contentDataAttrs}
            {...resolved.styles.content}
          >
            <Show when={typeof text() === 'string'} fallback={text()}>
              <span data-slot="tooltip-text" {...resolved.styles.text}>
                {text()}
              </span>
            </Show>
            <Show when={kbds()?.length ? kbds() : undefined}>
              {(keys) => (
                <KbdGroup
                  data-slot="tooltip-kbds"
                  variant={local.kbdVariant ?? (resolved.variants.invert ? 'invert' : undefined)}
                  size="sm"
                  items={keys()}
                  {...resolved.styles.kbds}
                />
              )}
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}
