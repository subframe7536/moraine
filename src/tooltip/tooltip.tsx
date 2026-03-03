import * as KobalteTooltip from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Kbd } from '../kbd'
import type { SlotClasses } from '../shared/slot-class'
import { cn } from '../shared/utils'

import { tooltipContentVariants } from './tooltip.class'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

type TooltipSlots = 'content' | 'trigger' | 'text' | 'kbds' | 'kbd'

export type TooltipClasses = SlotClasses<TooltipSlots>

export interface TooltipBaseProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: TooltipSide
  openDelay?: number
  closeDelay?: number
  disabled?: boolean
  text?: JSX.Element
  kbds?: string[]
  classes?: TooltipClasses
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
    },
    props,
  ) as TooltipProps
  const [contentProps, restProps] = splitProps(merged, ['text', 'kbds', 'classes', 'children'])

  const isDisabled = () => Boolean(restProps.disabled)

  return (
    <KobalteTooltip.Root disabled={isDisabled()} overflowPadding={4} {...restProps}>
      <KobalteTooltip.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        class={cn(contentProps.classes?.trigger)}
      >
        {contentProps.children}
      </KobalteTooltip.Trigger>

      <KobalteTooltip.Portal>
        <KobalteTooltip.Content
          data-slot="content"
          class={tooltipContentVariants(
            { side: restProps.placement },
            contentProps.classes?.content,
          )}
        >
          <Show when={typeof contentProps.text === 'string'} fallback={contentProps.text}>
            <span data-slot="text" class={cn('text-pretty leading-4', contentProps.classes?.text)}>
              {contentProps.text}
            </span>
          </Show>

          <Kbd
            data-slot="kbd"
            variant="invert"
            size="sm"
            value={contentProps.kbds}
            classes={{
              root: ['ms-1', contentProps.classes?.kbds],
              item: contentProps.classes?.kbd,
            }}
          />
        </KobalteTooltip.Content>
      </KobalteTooltip.Portal>
    </KobalteTooltip.Root>
  )
}
