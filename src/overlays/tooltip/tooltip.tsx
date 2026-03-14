import * as KobalteTooltip from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Kbd } from '../../elements/kbd'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

import { tooltipContentVariants } from './tooltip.class'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

type TooltipSlots = 'content' | 'trigger' | 'text' | 'kbds' | 'kbd'

export type TooltipClasses = SlotClasses<TooltipSlots>

export type TooltipStyles = SlotStyles<TooltipSlots>

export interface TooltipBaseProps {
  placement?: TooltipSide
  invert?: boolean
  text?: JSX.Element
  kbds?: string[]
  classes?: TooltipClasses
  styles?: TooltipStyles
  children: JSX.Element
}

export type TooltipProps = TooltipBaseProps &
  Omit<KobalteTooltip.TooltipRootProps, keyof TooltipBaseProps | 'children' | 'class'>

export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeProps(
    {
      placement: 'top' as const,
      openDelay: 0,
      closeDelay: 0,
      invert: false,
    },
    props,
  ) as TooltipProps
  const [contentProps, restProps] = splitProps(merged, [
    'text',
    'kbds',
    'invert',
    'classes',
    'styles',
    'children',
  ])

  const isDisabled = () => Boolean(restProps.disabled)

  return (
    <KobalteTooltip.Root disabled={isDisabled()} overflowPadding={4} {...restProps}>
      <KobalteTooltip.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={merged.styles?.trigger}
        class={cn('outline-none', contentProps.classes?.trigger)}
      >
        {contentProps.children}
      </KobalteTooltip.Trigger>

      <KobalteTooltip.Portal>
        <KobalteTooltip.Content
          data-slot="content"
          style={merged.styles?.content}
          class={tooltipContentVariants(
            { side: restProps.placement, invert: contentProps.invert! },
            contentProps.classes?.content,
          )}
        >
          <Show when={typeof contentProps.text === 'string'} fallback={contentProps.text}>
            <span
              data-slot="text"
              style={merged.styles?.text}
              class={cn('leading-4 text-pretty', contentProps.classes?.text)}
            >
              {contentProps.text}
            </span>
          </Show>

          <Kbd
            variant={contentProps.invert ? 'invert' : undefined}
            size="sm"
            value={contentProps.kbds}
            classes={{
              root: [contentProps.text && 'ms-1', contentProps.classes?.kbds],
              item: contentProps.classes?.kbd,
            }}
          />
        </KobalteTooltip.Content>
      </KobalteTooltip.Portal>
    </KobalteTooltip.Root>
  )
}
