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
  export interface Items {}
  export type Extend = KobalteDialog.DialogRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

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
  ) as SheetProps
  const [behaviorProps, contentProps, restProps] = splitProps(
    merged,
    ['overlay', 'transition', 'side', 'inset', 'close', 'dismissible', 'onClosePrevent'],
    ['title', 'description', 'header', 'body', 'footer', 'actions', 'classes', 'children'],
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

  const hasDefaultHeader = () =>
    Boolean(
      contentProps.title || contentProps.description || contentProps.actions || behaviorProps.close,
    )

  return (
    <KobalteDialog.Root modal {...restProps}>
      <KobalteDialog.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={merged.styles?.trigger}
        class={cn('outline-none', contentProps.classes?.trigger)}
      >
        {contentProps.children}
      </KobalteDialog.Trigger>

      <KobalteDialog.Portal>
        <Show when={behaviorProps.overlay}>
          <KobalteDialog.Overlay
            data-slot="overlay"
            style={merged.styles?.overlay}
            class={cn(
              'supports-backdrop-filter:backdrop-blur-xs data-ending-style:opacity-0 data-starting-style:opacity-0 bg-black/10 duration-150 inset-0 fixed z-50 data-closed:animate-overlay-out data-expanded:animate-overlay-in',
              contentProps.classes?.overlay,
            )}
          />
        </Show>

        <KobalteDialog.Content
          data-slot="content"
          style={merged.styles?.content}
          data-side={behaviorProps.side}
          class={sheetContentVariants(
            {
              side: behaviorProps.side,
              inset: behaviorProps.inset,
            },
            !behaviorProps.transition &&
              'transition-none data-expanded:animate-none data-closed:animate-none',
            contentProps.classes?.content,
          )}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <Show when={contentProps.header || hasDefaultHeader()}>
            <div
              data-slot="header"
              style={merged.styles?.header}
              class={cn('p-4 flex gap-2 items-start', contentProps.classes?.header)}
            >
              <Show
                when={contentProps.header}
                fallback={
                  <>
                    <div
                      data-slot="wrapper"
                      style={merged.styles?.wrapper}
                      class={cn('flex-1 gap-0.5 grid min-w-0', contentProps.classes?.wrapper)}
                    >
                      <Show when={contentProps.title}>
                        <KobalteDialog.Title
                          data-slot="title"
                          style={merged.styles?.title}
                          class={cn(
                            'text-base text-foreground font-medium',
                            contentProps.classes?.title,
                          )}
                        >
                          {contentProps.title}
                        </KobalteDialog.Title>
                      </Show>

                      <Show when={contentProps.description}>
                        <KobalteDialog.Description
                          data-slot="description"
                          style={merged.styles?.description}
                          class={cn(
                            'text-sm text-muted-foreground',
                            contentProps.classes?.description,
                          )}
                        >
                          {contentProps.description}
                        </KobalteDialog.Description>
                      </Show>
                    </div>

                    <Show when={contentProps.actions}>
                      <div
                        data-slot="actions"
                        style={merged.styles?.actions}
                        class={cn(
                          'ms-auto inline-flex shrink-0 gap-2 items-center',
                          contentProps.classes?.actions,
                        )}
                      >
                        {contentProps.actions}
                      </div>
                    </Show>

                    <Show when={behaviorProps.close !== false}>
                      <KobalteDialog.CloseButton
                        data-slot="close"
                        style={merged.styles?.close}
                        class={cn(
                          'text-muted-foreground b-(1 transparent) rounded-md inline-flex shrink-0 size-8 transition-colors items-center justify-center hover:(text-accent-foreground bg-accent) focus-visible:effect-fv-border',
                          contentProps.classes?.close,
                        )}
                        aria-label="Close"
                      >
                        <Show when={behaviorProps.close === true} fallback={behaviorProps.close}>
                          <Icon name="icon-close" />
                        </Show>
                      </KobalteDialog.CloseButton>
                    </Show>
                  </>
                }
              >
                {contentProps.header}
              </Show>
            </div>
          </Show>

          <Show when={contentProps.body}>
            <div
              data-slot="body"
              style={merged.styles?.body}
              class={cn(
                'flex-1 overflow-auto',
                contentProps.header || hasDefaultHeader() ? 'px-4 pb-4 pt-0' : 'p-4',
                contentProps.classes?.body,
              )}
            >
              {contentProps.body}
            </div>
          </Show>

          <Show when={contentProps.footer}>
            <div
              data-slot="footer"
              style={merged.styles?.footer}
              class={cn('mt-auto p-4 flex flex-col gap-2', contentProps.classes?.footer)}
            >
              {contentProps.footer}
            </div>
          </Show>
        </KobalteDialog.Content>
      </KobalteDialog.Portal>
    </KobalteDialog.Root>
  )
}
