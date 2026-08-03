import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
import { PopperContent, PopperRoot, PopperTrigger, resolveOverlayMenuSide } from '../base'
import type { OverlayMenuSide, PopperContentContext, PopperRootProps } from '../base'

import { popoverContentVariants } from './popover.class'
import type { PopoverContentVariantProps } from './popover.class'

type PopoverMode = 'click' | 'hover'

export namespace PopoverT {
  export interface Slot<T = unknown> {
    /** Element users activate to open the popover. */
    trigger?: T

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
    | 'placement'
    | 'forceMount'
    | 'modal'
    | 'preventScroll'
    | 'dismissible'
    | 'onClosePrevent'
  > {
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
     * The reference element that triggers the popover.
     */
    children: JSX.Element
  }

  /**
   * Props for the Popover component.
   */
  export type Props = BaseProps<'span', Base, Variant, Slot>
}

/**
 * Props for the Popover component.
 */
export interface PopoverProps extends PopoverT.Props {}

type PopoverSide = OverlayMenuSide

/** Click-triggered floating content panel anchored to a trigger element. */
export function Popover(props: PopoverProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'placement',
    'forceMount',
    'modal',
    'preventScroll',
    'dismissible',
    'onClosePrevent',
    'mode',
    'openDelay',
    'closeDelay',
    'content',
    'children',
    'classes',
    'styles',
    'class',
    'style',
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
  const content = createMemo(() => merged.content)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    clearTimeout(resetTimeout)
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

  function Content(context: PopperContentContext): JSX.Element {
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
      forceMount={merged.forceMount}
      overflowPadding={4}
      modal={merged.modal}
      preventScroll={merged.preventScroll}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      role="dialog"
      toggleOnClick={merged.mode === 'click'}
      onTriggerPointerEnter={
        merged.mode === 'hover'
          ? ({ open }) => {
              clearTimeout(closeTimer)
              closeTimer = undefined
              openTimer = setTimeout(() => {
                open()
                openTimer = undefined
              }, merged.openDelay)
            }
          : undefined
      }
      onTriggerPointerLeave={
        merged.mode === 'hover'
          ? ({ close }) => {
              clearTimeout(openTimer)
              openTimer = undefined
              closeTimer = setTimeout(() => {
                close()
                closeTimer = undefined
              }, merged.closeDelay)
            }
          : undefined
      }
      onContentPointerEnter={
        merged.mode === 'hover'
          ? () => {
              clearTimeout(closeTimer)
              closeTimer = undefined
            }
          : undefined
      }
      onContentPointerLeave={
        merged.mode === 'hover'
          ? ({ close }) => {
              clearTimeout(openTimer)
              openTimer = undefined
              closeTimer = setTimeout(() => {
                close()
                closeTimer = undefined
              }, merged.closeDelay)
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
      <PopperTrigger
        {...rest}
        describeTrigger={false}
        toggleOnClick={merged.mode === 'click'}
        style={{ ...merged.styles?.trigger, ...merged.style }}
        class={cn(merged.classes?.trigger, merged.class)}
      >
        {merged.children}
      </PopperTrigger>
      <PopperContent contentRender={Content} />
    </PopperRoot>
  )
}
