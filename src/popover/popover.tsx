import * as KobalteHoverCard from '@kobalte/core/hover-card'
import * as KobaltePopover from '@kobalte/core/popover'
import type { PopoverContentProps as KobaltePopoverContentProps } from '@kobalte/core/popover'
import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js'

import { cn } from '../shared/utils'

import { popoverContentVariants } from './popover.class'
import type { PopoverContentVariantProps } from './popover.class'

type PopoverMode = 'click' | 'hover'

export interface PopoverClasses {
  trigger?: string
  content?: string
  body?: string
  arrow?: string
}

export interface PopoverBaseProps {
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: PopoverMode
  gutter?: number
  openDelay?: number
  closeDelay?: number
  content?: JSX.Element
  arrow?: boolean
  dismissible?: boolean
  classes?: PopoverClasses
  onClosePrevent?: () => void
  children: JSX.Element
}

type PopoverRootProps = Omit<KobaltePopover.PopoverRootProps, 'children' | 'class'> &
  Omit<KobalteHoverCard.HoverCardRootProps, 'children' | 'class'>

export type PopoverProps = PopoverBaseProps & Omit<PopoverRootProps, keyof PopoverBaseProps>

export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: 'click' as const,
      placement: 'bottom' as const,
      gutter: 8,
      openDelay: 0,
      closeDelay: 0,
      arrow: true,
      dismissible: true,
    },
    props,
  ) as PopoverProps
  const [behaviorProps, contentProps, rootProps] = splitProps(
    merged,
    ['mode', 'placement', 'dismissible', 'onClosePrevent'],
    ['content', 'arrow', 'classes', 'children'],
  )

  const side = createMemo<PopoverContentVariantProps['side']>(
    () => behaviorProps.placement?.split('-')?.[0] as any,
  )

  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => clearTimeout(resetTimeout))

  const onPointerDownOutside = (
    event: Parameters<NonNullable<KobaltePopoverContentProps['onPointerDownOutside']>>[0],
  ) => {
    if (behaviorProps.dismissible) {
      return
    }
    event.preventDefault()
    hasPreventedPointerAttempt = true
    clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      hasPreventedPointerAttempt = false
      resetTimeout = undefined
    }, 0)
    behaviorProps.onClosePrevent?.()
  }

  const onInteractOutside = (
    event: Parameters<NonNullable<KobaltePopoverContentProps['onInteractOutside']>>[0],
  ) => {
    if (behaviorProps.dismissible || event.defaultPrevented) {
      return
    }
    event.preventDefault()
    if (!hasPreventedPointerAttempt) {
      behaviorProps.onClosePrevent?.()
    }
  }

  const onEscapeKeyDown = (
    event: Parameters<NonNullable<KobaltePopoverContentProps['onEscapeKeyDown']>>[0],
  ) => {
    if (behaviorProps.dismissible) {
      return
    }
    event.preventDefault()
    behaviorProps.onClosePrevent?.()
  }

  const contentClass = () => popoverContentVariants({ side: side() }, contentProps.classes?.content)

  const innerContent = () => (
    <>
      <Show when={contentProps.arrow}>
        <KobaltePopover.Arrow size={20} class={contentProps.classes?.arrow} />
      </Show>
      <Show when={contentProps.content !== undefined && contentProps.content !== null}>
        <div
          data-slot="body"
          class={cn(
            'max-h-$kb-popper-content-available-height overflow-auto',
            contentProps.classes?.body,
          )}
        >
          {contentProps.content}
        </div>
      </Show>
    </>
  )

  return (
    <Show
      when={behaviorProps.mode === 'hover'}
      fallback={
        <KobaltePopover.Root
          placement={behaviorProps.placement}
          overflowPadding={-6}
          {...rootProps}
        >
          <KobaltePopover.Trigger
            as="span"
            data-slot="trigger"
            class={contentProps.classes?.trigger}
          >
            {contentProps.children}
          </KobaltePopover.Trigger>
          <KobaltePopover.Portal>
            <KobaltePopover.Content
              data-slot="content"
              class={contentClass()}
              onPointerDownOutside={onPointerDownOutside}
              onInteractOutside={onInteractOutside}
              onEscapeKeyDown={onEscapeKeyDown}
            >
              {innerContent()}
            </KobaltePopover.Content>
          </KobaltePopover.Portal>
        </KobaltePopover.Root>
      }
    >
      <KobalteHoverCard.Root
        placement={behaviorProps.placement}
        overflowPadding={-6}
        {...rootProps}
      >
        <KobalteHoverCard.Trigger
          as="span"
          data-slot="trigger"
          class={contentProps.classes?.trigger}
        >
          {contentProps.children}
        </KobalteHoverCard.Trigger>
        <KobalteHoverCard.Portal>
          <KobalteHoverCard.Content data-slot="content" class={contentClass()}>
            {innerContent()}
          </KobalteHoverCard.Content>
        </KobalteHoverCard.Portal>
      </KobalteHoverCard.Root>
    </Show>
  )
}
