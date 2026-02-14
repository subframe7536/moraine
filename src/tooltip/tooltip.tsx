import * as KobalteTooltip from '@kobalte/core/tooltip'
import type {
  TooltipArrowProps as KobalteTooltipArrowProps,
  TooltipContentProps as KobalteTooltipContentProps,
  TooltipPortalProps as KobalteTooltipPortalProps,
  TooltipRootProps as KobalteTooltipRootProps,
} from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { For, Show, children, createMemo, mergeProps, splitProps } from 'solid-js'

import { cn } from '../shared/utils'

import {
  tooltipArrowVariants,
  tooltipContentVariants,
  tooltipKbdsVariants,
  tooltipKbdVariants,
  tooltipTextVariants,
} from './tooltip.class'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
type TooltipKbd = string | JSX.Element

export interface TooltipClasses {
  trigger?: string
  content?: string
  text?: string
  kbds?: string
  kbd?: string
  arrow?: string
}

export interface TooltipBaseProps {
  text?: JSX.Element
  kbds?: TooltipKbd[]
  content?: Omit<KobalteTooltipContentProps, 'children'>
  arrow?: boolean | Omit<KobalteTooltipArrowProps, 'children'>
  portal?: boolean | Omit<KobalteTooltipPortalProps, 'children'>
  class?: string
  classes?: TooltipClasses
  children?: JSX.Element
}

export type TooltipProps = TooltipBaseProps &
  Omit<KobalteTooltipRootProps, keyof TooltipBaseProps | 'children'>

function resolveTooltipSide(placement?: string): TooltipSide {
  if (placement?.startsWith('right')) {
    return 'right'
  }

  if (placement?.startsWith('bottom')) {
    return 'bottom'
  }

  if (placement?.startsWith('left')) {
    return 'left'
  }

  return 'top'
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeProps(
    {
      portal: true,
      placement: 'top' as const,
      gutter: 8,
      openDelay: 0,
    },
    props,
  )

  const [local, rest] = splitProps(merged as TooltipProps, [
    'text',
    'kbds',
    'content',
    'arrow',
    'portal',
    'placement',
    'class',
    'classes',
    'children',
    'disabled',
  ])

  const contentProps = createMemo(() => {
    const source = (local.content ?? {}) as KobalteTooltipContentProps & {
      class?: string
    }
    const { class: _className, ...resolved } = source

    return resolved as Omit<KobalteTooltipContentProps, 'children'>
  })
  const contentClass = createMemo(() =>
    cn(
      tooltipContentVariants({
        side: resolveTooltipSide(local.placement),
      }),
      local.classes?.content,
      local.class,
      (local.content as { class?: string } | undefined)?.class,
    ),
  )

  const arrowEnabled = createMemo(() => Boolean(local.arrow))
  const arrowProps = createMemo(() => {
    if (typeof local.arrow !== 'object') {
      return {} as Omit<KobalteTooltipArrowProps, 'children'>
    }

    const { class: _className, ...resolved } = local.arrow as KobalteTooltipArrowProps & {
      class?: string
    }

    return resolved as Omit<KobalteTooltipArrowProps, 'children'>
  })
  const arrowClass = createMemo(() =>
    cn(
      tooltipArrowVariants(),
      local.classes?.arrow,
      (local.arrow as { class?: string } | undefined)?.class,
    ),
  )

  const portalEnabled = createMemo(() => local.portal !== false)
  const portalProps = createMemo(() => {
    if (typeof local.portal !== 'object') {
      return {} as Omit<KobalteTooltipPortalProps, 'children'>
    }

    return local.portal
  })

  const triggerChildren = children(() => local.children)
  const hasTrigger = createMemo(() => triggerChildren.toArray().length > 0)
  const hasTooltipContent = createMemo(() => {
    return Boolean(local.text) || (local.kbds?.length ?? 0) > 0
  })
  const disabled = createMemo(() => Boolean(local.disabled) || !hasTooltipContent())

  const tooltipContent = (): JSX.Element => (
    <KobalteTooltip.Content data-slot="content" class={contentClass()} {...contentProps()}>
      <Show when={local.text}>
        <span data-slot="text" class={cn(tooltipTextVariants(), local.classes?.text)}>
          {local.text}
        </span>
      </Show>

      <Show when={(local.kbds?.length ?? 0) > 0}>
        <span data-slot="kbds" class={cn(tooltipKbdsVariants(), local.classes?.kbds)}>
          <For each={local.kbds}>
            {(kbd) => (
              <kbd data-slot="kbd" class={cn(tooltipKbdVariants(), local.classes?.kbd)}>
                {kbd}
              </kbd>
            )}
          </For>
        </span>
      </Show>

      <Show when={arrowEnabled()}>
        <KobalteTooltip.Arrow data-slot="arrow" class={arrowClass()} {...arrowProps()} />
      </Show>
    </KobalteTooltip.Content>
  )

  return (
    <KobalteTooltip.Root placement={local.placement} disabled={disabled()} {...rest}>
      <Show when={hasTrigger()}>
        <KobalteTooltip.Trigger as="span" data-slot="trigger" class={local.classes?.trigger}>
          {triggerChildren()}
        </KobalteTooltip.Trigger>
      </Show>

      <Show when={!disabled()}>
        <Show when={portalEnabled()} fallback={tooltipContent()}>
          <KobalteTooltip.Portal {...portalProps()}>{tooltipContent()}</KobalteTooltip.Portal>
        </Show>
      </Show>
    </KobalteTooltip.Root>
  )
}
