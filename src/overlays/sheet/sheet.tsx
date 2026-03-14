import * as KobalteDialog from '@kobalte/core/dialog'
import type { DialogContentProps as KobalteDialogContentProps } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

import { sheetContentVariants } from './sheet.class'

type SheetSide = 'left' | 'right' | 'top' | 'bottom'

type SheetSlots =
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

export type SheetClasses = SlotClasses<SheetSlots>

export type SheetStyles = SlotStyles<SheetSlots>

export interface SheetBaseProps {
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: JSX.Element
  description?: JSX.Element
  overlay?: boolean
  transition?: boolean
  side?: SheetSide
  inset?: boolean
  close?: boolean | JSX.Element
  dismissible?: boolean
  onClosePrevent?: () => void
  header?: JSX.Element
  body?: JSX.Element
  footer?: JSX.Element
  actions?: JSX.Element
  classes?: SheetClasses
  styles?: SheetStyles
  children: JSX.Element
}

export type SheetProps = SheetBaseProps &
  Omit<KobalteDialog.DialogRootProps, keyof SheetBaseProps | 'children' | 'class'>

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
              'supports-backdrop-filter:backdrop-blur-xs data-ending-style:opacity-0 data-starting-style:opacity-0 bg-black/10 duration-150 inset-0 fixed z-50 data-closed:(animate-out fade-out-0) data-expanded:(animate-in fade-in-0)',
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
