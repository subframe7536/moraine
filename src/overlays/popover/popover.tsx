import * as KobaltePopover from '@kobalte/core/popover'
import type { JSX } from 'solid-js'
import { Show, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

import { popoverContentVariants } from './popover.class'

type PopoverMode = 'click' | 'hover'

type PopoverSlots = 'trigger' | 'content' | 'body'

export type PopoverClasses = SlotClasses<PopoverSlots>

export type PopoverStyles = SlotStyles<PopoverSlots>

export interface PopoverBaseProps {
  mode?: PopoverMode
  openDelay?: number
  closeDelay?: number
  content?: JSX.Element
  dismissible?: boolean
  classes?: PopoverClasses
  styles?: PopoverStyles
  onClosePrevent?: () => void
  children: JSX.Element
}

type PopoverRootProps = Omit<KobaltePopover.PopoverRootProps, 'children' | 'class'>

export type PopoverProps = PopoverBaseProps &
  Omit<PopoverRootProps, keyof PopoverBaseProps | 'arrow'>

export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: 'click' as const,
      placement: 'bottom' as const,
      openDelay: 100,
      closeDelay: 100,
      dismissible: true,
    },
    props,
  ) as PopoverProps
  const [behaviorProps, contentProps, restProps] = splitProps(
    merged,
    ['mode', 'placement', 'openDelay', 'closeDelay', 'dismissible', 'onClosePrevent'],
    ['content', 'classes', 'children'],
  )

  const [hoverOpen, setHoverOpen] = createSignal<boolean>(restProps.defaultOpen ?? false)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    clearTimeout(resetTimeout)
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

  return (
    <KobaltePopover.Root
      placement={behaviorProps.placement}
      overflowPadding={4}
      {...restProps}
      open={
        behaviorProps.mode === 'hover'
          ? restProps.open !== undefined
            ? restProps.open
            : hoverOpen()
          : restProps.open
      }
    >
      <KobaltePopover.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={merged.styles?.trigger}
        class={cn('outline-none', contentProps.classes?.trigger)}
        onMouseEnter={
          behaviorProps.mode === 'hover'
            ? () => {
                clearTimeout(closeTimer)
                closeTimer = undefined
                openTimer = setTimeout(() => {
                  setHoverOpen(true)
                  restProps.onOpenChange?.(true)
                  openTimer = undefined
                }, behaviorProps.openDelay)
              }
            : undefined
        }
        onMouseLeave={
          behaviorProps.mode === 'hover'
            ? () => {
                clearTimeout(openTimer)
                openTimer = undefined
                closeTimer = setTimeout(() => {
                  setHoverOpen(false)
                  restProps.onOpenChange?.(false)
                  closeTimer = undefined
                }, behaviorProps.closeDelay)
              }
            : undefined
        }
      >
        {contentProps.children}
      </KobaltePopover.Trigger>
      <KobaltePopover.Portal>
        <KobaltePopover.Content
          data-slot="content"
          style={merged.styles?.content}
          class={popoverContentVariants(
            { side: behaviorProps.placement?.split('-')?.[0] as any },
            contentProps.classes?.content,
          )}
          onPointerDownOutside={(event) => {
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
          }}
          onInteractOutside={(event) => {
            if (behaviorProps.dismissible || event.defaultPrevented) {
              return
            }
            event.preventDefault()
            if (!hasPreventedPointerAttempt) {
              behaviorProps.onClosePrevent?.()
            }
          }}
          onEscapeKeyDown={(event) => {
            if (behaviorProps.dismissible) {
              return
            }
            event.preventDefault()
            behaviorProps.onClosePrevent?.()
          }}
        >
          <Show when={contentProps.content !== undefined && contentProps.content !== null}>
            <div
              data-slot="body"
              style={merged.styles?.body}
              class={cn(
                'max-h-$kb-popper-content-available-height overflow-auto',
                contentProps.classes?.body,
              )}
            >
              {contentProps.content}
            </div>
          </Show>
        </KobaltePopover.Content>
      </KobaltePopover.Portal>
    </KobaltePopover.Root>
  )
}
