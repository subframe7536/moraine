import * as KobaltePopover from '@kobalte/core/popover'
import type { JSX } from 'solid-js'
import { Show, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
import { cn } from '../../shared/utils'

import { popoverContentVariants } from './popover.class'
import type { PopoverContentVariantProps } from './popover.class'

type PopoverMode = 'click' | 'hover'

type PopoverSlots = 'trigger' | 'content' | 'body'

export type PopoverClasses = SlotClasses<PopoverSlots>

export type PopoverStyles = SlotStyles<PopoverSlots>

/**
 * Base props for the Popover component.
 */
export interface PopoverBaseProps extends PopoverContentVariantProps {
  /**
   * Interaction mode for triggering the popover.
   * @default 'click'
   */
  mode?: PopoverMode

  /**
   * Delay in milliseconds before opening in hover mode.
   * @default 100
   */
  openDelay?: number

  /**
   * Delay in milliseconds before closing in hover mode.
   * @default 100
   */
  closeDelay?: number

  /**
   * Content to render inside the popover body.
   */
  content?: JSX.Element

  /**
   * Whether the popover should close when clicking outside or pressing Escape.
   * @default true
   */
  dismissible?: boolean

  /**
   * Slot-based class overrides.
   */
  classes?: PopoverClasses

  /**
   * Slot-based style overrides.
   */
  styles?: PopoverStyles

  /**
   * Callback triggered when a dismissal action is prevented.
   */
  onClosePrevent?: () => void

  /**
   * The reference element that triggers the popover.
   */
  children: JSX.Element
}

/**
 * Props for the Popover component.
 */
export type PopoverProps = RockUIComposeProps<PopoverBaseProps, KobaltePopover.PopoverRootProps>

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
