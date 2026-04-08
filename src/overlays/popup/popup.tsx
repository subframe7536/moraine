import * as KobalteDialog from '@kobalte/core/dialog'
import type { DialogContentProps as KobalteDialogContentProps } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import { popupContentVariants, popupOverlayVariants } from './popup.class'
import type { PopupVariantProps } from './popup.class'

export namespace PopupT {
  export type Slot = 'trigger' | 'overlay' | 'content'
  export type Variant = PopupVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteDialog.DialogRootProps

  export interface Items {}

  /**
   * Base props for the Popup component.
   */
  export interface Base {
    /**
     * Whether to display a backdrop overlay.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether to allow scrolling within the popup.
     * @default false
     */
    scrollable?: boolean

    /**
     * Whether the popup should cover the entire viewport.
     * @default false
     */
    fullscreen?: boolean

    /**
     * Whether the popup should close on outside interaction or Escape key.
     * @default true
     */
    dismissible?: boolean

    /**
     * Callback triggered when a dismissal is prevented.
     */
    onClosePrevent?: () => void

    /**
     * Main content to render inside the popup.
     */
    content?: JSX.Element

    /**
     * Element that triggers the popup or additional content.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Popup component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot, 'preventScroll'> {}
}

/**
 * Props for the Popup component.
 */
export interface PopupProps extends PopupT.Props {}

/** Low-level overlay primitive providing portal, overlay backdrop, and content positioning. */
export function Popup(props: PopupProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      dismissible: true,
    },
    props,
  )
  const [local, rest] = splitProps(merged, [
    'overlay',
    'scrollable',
    'fullscreen',
    'dismissible',
    'onClosePrevent',
    'content',
    'classes',
    'children',
  ])

  const preventDismiss = () => {
    local.onClosePrevent?.()
  }

  let hasPreventedPointerAttempt = false
  let resetPreventedPointerAttemptTimeout: ReturnType<typeof setTimeout> | undefined

  const schedulePreventedPointerAttemptReset = () => {
    if (resetPreventedPointerAttemptTimeout !== undefined) {
      clearTimeout(resetPreventedPointerAttemptTimeout)
    }

    resetPreventedPointerAttemptTimeout = setTimeout(() => {
      hasPreventedPointerAttempt = false
      resetPreventedPointerAttemptTimeout = undefined
    }, 0)
  }

  onCleanup(() => {
    if (resetPreventedPointerAttemptTimeout !== undefined) {
      clearTimeout(resetPreventedPointerAttemptTimeout)
    }
  })

  const onPointerDownOutside = (
    event: Parameters<NonNullable<KobalteDialogContentProps['onPointerDownOutside']>>[0],
  ) => {
    if (local.dismissible) {
      return
    }

    event.preventDefault()
    hasPreventedPointerAttempt = true
    schedulePreventedPointerAttemptReset()
    preventDismiss()
  }

  const onInteractOutside = (
    event: Parameters<NonNullable<KobalteDialogContentProps['onInteractOutside']>>[0],
  ) => {
    if (local.dismissible || event.defaultPrevented) {
      return
    }

    if (hasPreventedPointerAttempt) {
      event.preventDefault()
      return
    }

    event.preventDefault()
    preventDismiss()
  }

  const onEscapeKeyDown = (
    event: Parameters<NonNullable<KobalteDialogContentProps['onEscapeKeyDown']>>[0],
  ) => {
    if (local.dismissible) {
      return
    }

    event.preventDefault()
    preventDismiss()
  }

  const contentLayout = () => {
    if (local.fullscreen) {
      return 'fullscreen'
    }

    if (local.scrollable) {
      return 'scrollable'
    }

    return 'default'
  }

  const popupContent = () => (
    <Show when={local.content}>
      <KobalteDialog.Content
        data-slot="content"
        style={merged.styles?.content}
        class={popupContentVariants(
          {
            layout: contentLayout(),
          },
          local.classes?.content,
        )}
        onPointerDownOutside={onPointerDownOutside}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {local.content}
      </KobalteDialog.Content>
    </Show>
  )

  return (
    <KobalteDialog.Root preventScroll={!local.scrollable} {...rest}>
      <Show when={local.children}>
        <KobalteDialog.Trigger
          as="span"
          tabIndex={-1}
          data-slot="trigger"
          style={merged.styles?.trigger}
          class={cn('outline-none', local.classes?.trigger)}
        >
          {local.children}
        </KobalteDialog.Trigger>
      </Show>

      <KobalteDialog.Portal>
        <Show
          when={local.scrollable && local.overlay}
          fallback={
            <>
              <Show when={local.overlay}>
                <KobalteDialog.Overlay
                  data-slot="overlay"
                  style={merged.styles?.overlay}
                  class={popupOverlayVariants(
                    {
                      scrollable: local.scrollable,
                    },
                    local.classes?.overlay,
                  )}
                />
              </Show>

              {popupContent()}
            </>
          }
        >
          <KobalteDialog.Overlay
            data-slot="overlay"
            style={merged.styles?.overlay}
            class={popupOverlayVariants(
              {
                scrollable: local.scrollable,
              },
              local.classes?.overlay,
            )}
          >
            {popupContent()}
          </KobalteDialog.Overlay>
        </Show>
      </KobalteDialog.Portal>
    </KobalteDialog.Root>
  )
}
