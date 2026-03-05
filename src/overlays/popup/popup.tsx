import * as KobalteDialog from '@kobalte/core/dialog'
import type { DialogContentProps as KobalteDialogContentProps } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'

import { popupContentVariants, popupOverlayVariants } from './popup.class'

type PopupSlots = 'trigger' | 'overlay' | 'content'

export type PopupClasses = SlotClasses<PopupSlots>

export interface PopupBaseProps {
  overlay?: boolean
  scrollable?: boolean
  transition?: boolean
  fullscreen?: boolean
  dismissible?: boolean
  onClosePrevent?: () => void
  content?: JSX.Element
  classes?: PopupClasses
}

export type PopupProps = PopupBaseProps &
  Omit<KobalteDialog.DialogRootProps, keyof PopupBaseProps | 'class' | 'preventScroll'>

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
