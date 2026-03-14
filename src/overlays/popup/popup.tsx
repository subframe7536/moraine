import * as KobalteDialog from '@kobalte/core/dialog'
import type { DialogContentProps as KobalteDialogContentProps } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
import { cn } from '../../shared/utils'

import { popupContentVariants, popupOverlayVariants } from './popup.class'
import type { PopupContentVariantProps } from './popup.class'

type PopupSlots = 'trigger' | 'overlay' | 'content'

export type PopupClasses = SlotClasses<PopupSlots>

export type PopupStyles = SlotStyles<PopupSlots>

/**
 * Base props for the Popup component.
 */
export interface PopupBaseProps extends PopupContentVariantProps {
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
   * Whether to enable transition animations.
   * @default true
   */
  transition?: boolean

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
   * Slot-based class overrides.
   */
  classes?: PopupClasses

  /**
   * Slot-based style overrides.
   */
  styles?: PopupStyles

  /**
   * Element that triggers the popup or additional content.
   */
  children?: JSX.Element
}

/**
 * Props for the Popup component.
 */
export type PopupProps = RockUIComposeProps<
  PopupBaseProps,
  KobalteDialog.DialogRootProps,
  'preventScroll'
>

export function Popup(props: PopupProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      dismissible: true,
    },
    props,
  ) as PopupProps
  const [behaviorProps, contentProps, restProps] = splitProps(
    merged,
    ['overlay', 'scrollable', 'transition', 'fullscreen', 'dismissible', 'onClosePrevent'],
    ['content', 'classes', 'children'],
  )

  const preventDismiss = () => {
    behaviorProps.onClosePrevent?.()
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
    if (behaviorProps.dismissible) {
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
    if (behaviorProps.dismissible || event.defaultPrevented) {
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
    if (behaviorProps.dismissible) {
      return
    }

    event.preventDefault()
    preventDismiss()
  }

  const contentLayout = () => {
    if (behaviorProps.fullscreen) {
      return 'fullscreen'
    }

    if (behaviorProps.scrollable) {
      return 'scrollable'
    }

    return 'default'
  }

  const popupContent = () => (
    <Show when={contentProps.content}>
      <KobalteDialog.Content
        data-slot="content"
        style={merged.styles?.content}
        class={popupContentVariants(
          {
            layout: contentLayout(),
            transition: behaviorProps.transition,
          },
          contentProps.classes?.content,
        )}
        onPointerDownOutside={onPointerDownOutside}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {contentProps.content}
      </KobalteDialog.Content>
    </Show>
  )

  return (
    <KobalteDialog.Root preventScroll={!behaviorProps.scrollable} {...restProps}>
      <Show when={contentProps.children}>
        <KobalteDialog.Trigger
          as="span"
          tabIndex={-1}
          data-slot="trigger"
          style={merged.styles?.trigger}
          class={cn('outline-none', contentProps.classes?.trigger)}
        >
          {contentProps.children}
        </KobalteDialog.Trigger>
      </Show>

      <KobalteDialog.Portal>
        <Show
          when={behaviorProps.scrollable && behaviorProps.overlay}
          fallback={
            <>
              <Show when={behaviorProps.overlay}>
                <KobalteDialog.Overlay
                  data-slot="overlay"
                  style={merged.styles?.overlay}
                  class={popupOverlayVariants(
                    {
                      scrollable: behaviorProps.scrollable,
                    },
                    contentProps.classes?.overlay,
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
                scrollable: behaviorProps.scrollable,
              },
              contentProps.classes?.overlay,
            )}
          >
            {popupContent()}
          </KobalteDialog.Overlay>
        </Show>
      </KobalteDialog.Portal>
    </KobalteDialog.Root>
  )
}
