import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, onCleanup, splitProps } from 'solid-js'

import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'
import { PopperContent, PopperRoot, PopperTrigger, resolveOverlayMenuSide } from '../base/index.ts'
import type { OverlayMenuSide, PopperContentContext, PopperRootProps } from '../base/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { popoverContentVariants } from './popover.class.ts'
import type { PopoverContentVariantProps } from './popover.class.ts'

type PopoverMode = 'click' | 'hover'

export namespace PopoverT {
  export interface Slot<T = unknown> {
    /** Positioned popover panel anchored to the trigger. */
    content?: T

    /** Content body rendered inside the popover panel. */
    body?: T
  }

  export type Variant = PopoverContentVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Popover component.
   */
  export interface Base extends Pick<
    PopperRootProps,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'placement'
    | 'forceMount'
    | 'modal'
    | 'preventScroll'
    | 'dismissible'
    | 'onClosePrevent'
  > {
    /** Accessible name for the dialog content. */
    ariaLabel?: string

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

    classes?: Classes
    styles?: Styles

    /**
     * Content to render inside the popover body.
     */
    content?: JSX.Element

    /** Render the popover trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Popover component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = Base & Variant
}

/**
 * Props for the Popover component.
 */
export type PopoverProps = PopoverT.Props

type PopoverRuntimeProps = PopoverT.Base & {
  classes?: PopoverT.Classes
  styles?: PopoverT.Styles
}

type PopoverSide = OverlayMenuSide

/** Click-triggered floating content panel anchored to a trigger element. */
export function Popover(props: PopoverProps): JSX.Element {
  const [local] = splitProps(props as PopoverRuntimeProps, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'placement',
    'forceMount',
    'modal',
    'preventScroll',
    'dismissible',
    'onClosePrevent',
    'ariaLabel',
    'mode',
    'openDelay',
    'closeDelay',
    'content',
    'children',
    'classes',
    'styles',
  ])
  const merged = mergeProps(
    {
      mode: 'click' as const,
      placement: 'bottom' as const,
      openDelay: 100,
      closeDelay: 100,
      dismissible: true,
    },
    local,
  )

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined
  let hoverTimerVersion = 0
  let ownerAlive = true

  function clearOpenTimer(): void {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function invalidateHoverTimers(): void {
    hoverTimerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function scheduleOpen(open: () => void): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()
    const version = ++hoverTimerVersion
    openTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      openTimer = undefined
      open()
    }, merged.openDelay)
  }

  function scheduleClose(close: () => void): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    const version = ++hoverTimerVersion
    closeTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      closeTimer = undefined
      close()
    }, merged.closeDelay)
  }

  createEffect(
    on(
      () => [merged.mode, merged.disabled] as const,
      () => {
        invalidateHoverTimers()
      },
    ),
  )

  onCleanup(() => {
    ownerAlive = false
    clearTimeout(resetTimeout)
    invalidateHoverTimers()
  })

  function Content(context: PopperContentContext): JSX.Element {
    const content = createMemo(() => merged.content)
    const resolvedSide = createMemo<PopoverSide>(() => {
      const runtimePlacement = context.currentPlacement()

      if (runtimePlacement) {
        return resolveOverlayMenuSide(runtimePlacement)
      }

      return resolveOverlayMenuSide(merged.placement)
    })

    return (
      <div
        role={context.contentProps.role}
        aria-label={merged.ariaLabel}
        aria-modal={context.contentProps['aria-modal']}
        aria-labelledby={context.contentProps['aria-labelledby']}
        aria-describedby={context.contentProps['aria-describedby']}
        data-slot="content"
        style={merged.styles?.content}
        class={popoverContentVariants({ side: resolvedSide() }, merged.classes?.content)}
        {...context.contentProps}
      >
        <Show when={content() !== undefined && content() !== null}>
          <div
            data-slot="body"
            style={merged.styles?.body}
            class={cn(
              'max-h-$mo-popper-content-available-height overflow-auto',
              merged.classes?.body,
            )}
          >
            {content()}
          </div>
        </Show>
      </div>
    )
  }

  return (
    <PopperRoot
      id={merged.id}
      placement={merged.placement}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      disabled={merged.disabled}
      forceMount={merged.forceMount}
      overflowPadding={4}
      modal={merged.modal}
      preventScroll={merged.preventScroll}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      role="dialog"
      toggleOnClick
      onTriggerFocus={
        merged.mode === 'hover'
          ? ({ open }) => {
              scheduleOpen(open)
            }
          : undefined
      }
      onTriggerBlur={
        merged.mode === 'hover'
          ? ({ close }) => {
              scheduleClose(close)
            }
          : undefined
      }
      onTriggerPointerEnter={
        merged.mode === 'hover'
          ? ({ open }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleOpen(open)
              }
            }
          : undefined
      }
      onTriggerPointerLeave={
        merged.mode === 'hover'
          ? ({ close }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleClose(close)
              }
            }
          : undefined
      }
      onContentFocus={
        merged.mode === 'hover'
          ? () => {
              clearCloseTimer()
            }
          : undefined
      }
      onContentBlur={
        merged.mode === 'hover'
          ? ({ close }) => {
              scheduleClose(close)
            }
          : undefined
      }
      onContentPointerEnter={
        merged.mode === 'hover'
          ? (_, event) => {
              if (event.pointerType === 'mouse') {
                clearCloseTimer()
              }
            }
          : undefined
      }
      onContentPointerLeave={
        merged.mode === 'hover'
          ? ({ close }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleClose(close)
              }
            }
          : undefined
      }
      closeOnOutsideFocus={merged.mode === 'click'}
      onPointerDownOutside={(event) => {
        if (merged.dismissible) {
          return
        }

        event.preventDefault()
        hasPreventedPointerAttempt = true
        clearTimeout(resetTimeout)
        resetTimeout = setTimeout(() => {
          hasPreventedPointerAttempt = false
          resetTimeout = undefined
        }, 0)
        merged.onClosePrevent?.()
      }}
      onInteractOutside={(event) => {
        if (merged.dismissible || event.defaultPrevented) {
          return
        }

        event.preventDefault()

        if (!hasPreventedPointerAttempt) {
          merged.onClosePrevent?.()
        }
      }}
      onEscapeKeyDown={(event) => {
        if (merged.dismissible) {
          return
        }

        event.preventDefault()
        merged.onClosePrevent?.()
      }}
    >
      <PopperTrigger children={merged.children} describeTrigger={false} toggleOnClick />
      <PopperContent contentRender={Content} />
    </PopperRoot>
  )
}
