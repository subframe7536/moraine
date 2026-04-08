import * as KobaltePopover from '@kobalte/core/popover'
import { usePopperContext } from '@kobalte/core/popper'
import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'
import type { OverlayMenuSide } from '../shared-overlay-menu/utils'

import { popoverContentVariants } from './popover.class'
import type { PopoverContentVariantProps } from './popover.class'

type PopoverMode = 'click' | 'hover'

export namespace PopoverT {
  export type Slot = 'trigger' | 'content' | 'body'
  export type Variant = PopoverContentVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobaltePopover.PopoverRootProps

  export interface Items {}

  /**
   * Base props for the Popover component.
   */
  export interface Base {
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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Popover component.
 */
export interface PopoverProps extends PopoverT.Props {}

type PopoverSide = OverlayMenuSide

/** Click-triggered floating content panel anchored to a trigger element. */
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
  )
  const [local, rest] = splitProps(merged, [
    'mode',
    'placement',
    'open',
    'openDelay',
    'closeDelay',
    'dismissible',
    'onClosePrevent',
    'content',
    'classes',
    'styles',
    'children',
  ])

  const [hoverOpen, setHoverOpen] = createSignal<boolean>(rest.defaultOpen ?? false)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    clearTimeout(resetTimeout)
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

  function Content(): JSX.Element {
    const popperContext = usePopperContext()
    const resolvedSide = createMemo<PopoverSide>(() => {
      const runtimePlacement = popperContext.currentPlacement()

      if (runtimePlacement) {
        return resolveOverlayMenuSide(runtimePlacement)
      }

      return resolveOverlayMenuSide(local.placement)
    })

    return (
      <KobaltePopover.Content
        data-slot="content"
        style={local.styles?.content}
        class={popoverContentVariants({ side: resolvedSide() }, local.classes?.content)}
        onPointerDownOutside={(event) => {
          if (local.dismissible) {
            return
          }
          event.preventDefault()
          hasPreventedPointerAttempt = true
          clearTimeout(resetTimeout)
          resetTimeout = setTimeout(() => {
            hasPreventedPointerAttempt = false
            resetTimeout = undefined
          }, 0)
          local.onClosePrevent?.()
        }}
        onInteractOutside={(event) => {
          if (local.dismissible || event.defaultPrevented) {
            return
          }
          event.preventDefault()
          if (!hasPreventedPointerAttempt) {
            local.onClosePrevent?.()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (local.dismissible) {
            return
          }
          event.preventDefault()
          local.onClosePrevent?.()
        }}
      >
        <Show when={local.content !== undefined && local.content !== null}>
          <div
            data-slot="body"
            style={local.styles?.body}
            class={cn(
              'max-h-$kb-popper-content-available-height overflow-auto',
              local.classes?.body,
            )}
          >
            {local.content}
          </div>
        </Show>
      </KobaltePopover.Content>
    )
  }

  return (
    <KobaltePopover.Root
      placement={local.placement}
      overflowPadding={4}
      open={
        local.mode === 'hover' ? (local.open !== undefined ? local.open : hoverOpen()) : local.open
      }
      {...rest}
    >
      <KobaltePopover.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={local.styles?.trigger}
        class={cn('outline-none', local.classes?.trigger)}
        onMouseEnter={
          local.mode === 'hover'
            ? () => {
                clearTimeout(closeTimer)
                closeTimer = undefined
                openTimer = setTimeout(() => {
                  setHoverOpen(true)
                  rest.onOpenChange?.(true)
                  openTimer = undefined
                }, local.openDelay)
              }
            : undefined
        }
        onMouseLeave={
          local.mode === 'hover'
            ? () => {
                clearTimeout(openTimer)
                openTimer = undefined
                closeTimer = setTimeout(() => {
                  setHoverOpen(false)
                  rest.onOpenChange?.(false)
                  closeTimer = undefined
                }, local.closeDelay)
              }
            : undefined
        }
      >
        {local.children}
      </KobaltePopover.Trigger>
      <KobaltePopover.Portal>
        <Content />
      </KobaltePopover.Portal>
    </KobaltePopover.Root>
  )
}
