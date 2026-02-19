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

import { tooltipContentVariants } from './tooltip.class'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
type TooltipKbd = string | JSX.Element

export interface TooltipClasses {
  root?: string
  trigger?: string
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
  portal?: Omit<KobalteTooltipPortalProps, 'children'>
  classes?: TooltipClasses
  children?: JSX.Element
}

export type TooltipProps = TooltipBaseProps &
  Omit<KobalteTooltipRootProps, keyof TooltipBaseProps | 'children' | 'class'>

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

  const portalProps = createMemo(() => {
    if (typeof local.portal !== 'object') {
      return {} as Omit<KobalteTooltipPortalProps, 'children'>
    }

    return local.portal
  })
  const arrowProps = createMemo(() => {
    if (typeof local.arrow !== 'object') {
      return {} as Omit<KobalteTooltipArrowProps, 'children'>
    }

    const source = local.arrow as KobalteTooltipArrowProps & {
      class?: string
    }
    const { class: _className, ...resolved } = source

    return resolved as Omit<KobalteTooltipArrowProps, 'children'>
  })
  function arrowClass(): string | undefined {
    if (typeof local.arrow !== 'object') {
      return local.classes?.arrow
    }

    const arrow = local.arrow as KobalteTooltipArrowProps & { class?: string }

    return cn(arrow.class, local.classes?.arrow)
  }

  const triggerChildren = children(() => local.children)
  const hasTrigger = createMemo(() => triggerChildren.toArray().length > 0)
  const hasTooltipContent = createMemo(() => {
    return local.text || (local.kbds?.length ?? 0) > 0
  })
  const disabled = createMemo(() => local.disabled || !hasTooltipContent())

  return (
    <KobalteTooltip.Root
      placement={local.placement}
      disabled={disabled()}
      overflowPadding={-2}
      {...rest}
    >
      <Show when={hasTrigger()}>
        <KobalteTooltip.Trigger as="span" data-slot="trigger" class={local.classes?.trigger}>
          {triggerChildren()}
        </KobalteTooltip.Trigger>
      </Show>

      <Show when={hasTooltipContent()}>
        <KobalteTooltip.Portal {...portalProps()}>
          <KobalteTooltip.Content
            data-slot="content"
            class={tooltipContentVariants(
              {
                side: resolveTooltipSide(local.placement),
              },
              local.classes?.root,
            )}
            {...contentProps()}
          >
            <Show when={local.text}>
              <span data-slot="text" class={cn('text-pretty leading-4', local.classes?.text)}>
                {local.text}
              </span>
            </Show>

            <Show when={(local.kbds?.length || 0) > 0}>
              <span
                data-slot="kbds"
                class={cn('ms-1 inline-flex items-center gap-1', local.classes?.kbds)}
              >
                <For each={local.kbds}>
                  {(kbd) => (
                    <kbd
                      data-slot="kbd"
                      class={cn(
                        'inline-flex items-center rounded border bg-muted px-1 py-0.5 font-mono text-10px leading-none text-muted-foreground uppercase',
                        local.classes?.kbd,
                      )}
                    >
                      {kbd}
                    </kbd>
                  )}
                </For>
              </span>
            </Show>

            <Show when={local.arrow}>
              <KobalteTooltip.Arrow data-slot="arrow" class={arrowClass()} {...arrowProps()} />
            </Show>
          </KobalteTooltip.Content>
        </KobalteTooltip.Portal>
      </Show>
    </KobalteTooltip.Root>
  )
}
