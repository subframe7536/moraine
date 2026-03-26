import * as KobaltePopover from '@kobalte/core/popover'
import { usePopperContext } from '@kobalte/core/popper'
import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'
import type { OverlayMenuSide } from '../shared-overlay-menu/utils'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import { popoverContentVariants } from './popover.class'
import type { PopoverContentVariantProps } from './popover.class'

type PopoverMode = 'click' | 'hover'

export namespace PopoverT {
  export type Slot = 'trigger' | 'content' | 'body'
  export type Variant = PopoverContentVariantProps
  export interface Items {}
  export type Extend = KobaltePopover.PopoverRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

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

  function Content(): JSX.Element {
    const popperContext = usePopperContext()
    const resolvedSide = createMemo<PopoverSide>(() => {
      const runtimePlacement = popperContext.currentPlacement()

      if (runtimePlacement) {
        return resolveOverlayMenuSide(runtimePlacement)
      }

      return resolveOverlayMenuSide(behaviorProps.placement)
    })

    return (
      <KobaltePopover.Content
        data-slot="content"
        style={merged.styles?.content}
        class={popoverContentVariants(
          { side: resolvedSide() },
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
    )
  }

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
        <Content />
      </KobaltePopover.Portal>
    </KobaltePopover.Root>
  )
}
