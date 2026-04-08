import * as KobalteDialog from '@kobalte/core/dialog'
import type { DialogContentProps as KobalteDialogContentProps } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import { sheetContentVariants } from './sheet.class'
import type { SheetVariantProps } from './sheet.class'

export namespace SheetT {
  export type Slot =
    | 'trigger'
    | 'overlay'
    | 'content'
    | 'header'
    | 'wrapper'
    | 'title'
    | 'description'
    | 'actions'
    | 'close'
    | 'body'
    | 'footer'

  export type Variant = SheetVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteDialog.DialogRootProps

  export interface Items {}

  /**
   * Base props for the Sheet component.
   */
  export interface Base {
    /**
     * Unique identifier for the sheet.
     */
    id?: string

    /**
     * Controlled open state of the sheet.
     */
    open?: boolean

    /**
     * Initial open state when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean

    /**
     * Callback triggered when the open state changes.
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Primary title displayed in the sheet header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

    /**
     * Whether to display a backdrop overlay.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether to enable transition animations.
     * @default true
     */
    transition?: boolean

    /**
     * Whether to show a close button, or a custom element to use as one.
     * @default true
     */
    close?: boolean | JSX.Element

    /**
     * Whether the sheet should close when interacting outside or pressing Escape.
     * @default true
     */
    dismissible?: boolean

    /**
     * Callback triggered when a dismissal action is prevented.
     */
    onClosePrevent?: () => void

    /**
     * Custom element to render in the header slot.
     */
    header?: JSX.Element

    /**
     * Custom element to render in the scrollable body slot.
     */
    body?: JSX.Element

    /**
     * Custom element to render in the footer slot.
     */
    footer?: JSX.Element

    /**
     * Additional action elements to render in the header.
     */
    actions?: JSX.Element

    /**
     * Trigger element that opens the sheet.
     */
    children: JSX.Element
  }

  /**
   * Props for the Sheet component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Sheet component.
 */
export interface SheetProps extends SheetT.Props {}

/** Slide-in panel overlay from any screen edge with header, body, and footer slots. */
export function Sheet(props: SheetProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      side: 'right' as const,
      inset: false,
      close: true,
      dismissible: true,
    },
    props,
  )
  const [local, rest] = splitProps(merged, [
    'overlay',
    'transition',
    'side',
    'inset',
    'close',
    'dismissible',
    'onClosePrevent',
    'title',
    'description',
    'header',
    'body',
    'footer',
    'actions',
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

  const hasDefaultHeader = () =>
    Boolean(local.title || local.description || local.actions || local.close)

  return (
    <KobalteDialog.Root modal {...rest}>
      <KobalteDialog.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={merged.styles?.trigger}
        class={cn('outline-none', local.classes?.trigger)}
      >
        {local.children}
      </KobalteDialog.Trigger>

      <KobalteDialog.Portal>
        <Show when={local.overlay}>
          <KobalteDialog.Overlay
            data-slot="overlay"
            style={merged.styles?.overlay}
            class={cn(
              'bg-black/10 duration-150 inset-0 fixed z-50 backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in',
              local.classes?.overlay,
            )}
          />
        </Show>

        <KobalteDialog.Content
          data-slot="content"
          style={merged.styles?.content}
          data-side={local.side}
          class={sheetContentVariants(
            {
              side: local.side,
              inset: local.inset,
            },
            !local.transition &&
              'transition-none data-expanded:animate-none data-closed:animate-none',
            local.classes?.content,
          )}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <Show when={local.header || hasDefaultHeader()}>
            <div
              data-slot="header"
              style={merged.styles?.header}
              class={cn('p-4 flex gap-2 items-start', local.classes?.header)}
            >
              <Show
                when={local.header}
                fallback={
                  <>
                    <div
                      data-slot="wrapper"
                      style={merged.styles?.wrapper}
                      class={cn('flex-1 gap-0.5 grid min-w-0', local.classes?.wrapper)}
                    >
                      <Show when={local.title}>
                        <KobalteDialog.Title
                          data-slot="title"
                          style={merged.styles?.title}
                          class={cn('text-base text-foreground font-medium', local.classes?.title)}
                        >
                          {local.title}
                        </KobalteDialog.Title>
                      </Show>

                      <Show when={local.description}>
                        <KobalteDialog.Description
                          data-slot="description"
                          style={merged.styles?.description}
                          class={cn('text-sm text-muted-foreground', local.classes?.description)}
                        >
                          {local.description}
                        </KobalteDialog.Description>
                      </Show>
                    </div>

                    <Show when={local.actions}>
                      <div
                        data-slot="actions"
                        style={merged.styles?.actions}
                        class={cn(
                          'ms-auto inline-flex shrink-0 gap-2 items-center',
                          local.classes?.actions,
                        )}
                      >
                        {local.actions}
                      </div>
                    </Show>

                    <Show when={local.close !== false}>
                      <KobalteDialog.CloseButton
                        data-slot="close"
                        style={merged.styles?.close}
                        class={cn(
                          'text-muted-foreground b-(1 transparent) rounded-md inline-flex shrink-0 size-8 transition-colors items-center justify-center hover:(text-accent-foreground bg-accent) focus-visible:effect-fv-border',
                          local.classes?.close,
                        )}
                        aria-label="Close"
                      >
                        <Show when={local.close === true} fallback={local.close}>
                          <Icon name="icon-close" />
                        </Show>
                      </KobalteDialog.CloseButton>
                    </Show>
                  </>
                }
              >
                {local.header}
              </Show>
            </div>
          </Show>

          <Show when={local.body}>
            <div
              data-slot="body"
              style={merged.styles?.body}
              class={cn(
                'flex-1 overflow-auto',
                local.header || hasDefaultHeader() ? 'px-4 pb-4 pt-0' : 'p-4',
                local.classes?.body,
              )}
            >
              {local.body}
            </div>
          </Show>

          <Show when={local.footer}>
            <div
              data-slot="footer"
              style={merged.styles?.footer}
              class={cn('mt-auto p-4 flex flex-col gap-2', local.classes?.footer)}
            >
              {local.footer}
            </div>
          </Show>
        </KobalteDialog.Content>
      </KobalteDialog.Portal>
    </KobalteDialog.Root>
  )
}
