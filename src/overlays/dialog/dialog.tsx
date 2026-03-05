import * as KobalteDialog from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Card } from '../../elements/card'
import { IconButton } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'
import { Popup } from '../popup'

import { dialogCardVariants } from './dialog.class'

type ModalSlots =
  | 'trigger'
  | 'overlay'
  | 'content'
  | 'header'
  | 'wrapper'
  | 'title'
  | 'description'
  | 'close'
  | 'body'
  | 'footer'

export type ModalClasses = SlotClasses<ModalSlots>

export interface ModalBaseProps {
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: JSX.Element
  description?: JSX.Element
  overlay?: boolean
  scrollable?: boolean
  transition?: boolean
  fullscreen?: boolean
  close?: boolean
  closeIcon?: IconName
  dismissible?: boolean
  onClosePrevent?: () => void
  header?: JSX.Element
  body?: JSX.Element
  footer?: JSX.Element
  classes?: ModalClasses
}

export type ModalProps = ModalBaseProps &
  Omit<KobalteDialog.DialogRootProps, keyof ModalBaseProps | 'class'>

export function Dialog(props: ModalProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      close: true,
      closeIcon: 'icon-close',
      dismissible: true,
    },
    props,
  ) as ModalProps
  const [behaviorProps, contentProps, restProps] = splitProps(
    merged,
    [
      'overlay',
      'scrollable',
      'transition',
      'fullscreen',
      'close',
      'closeIcon',
      'dismissible',
      'onClosePrevent',
    ],
    ['title', 'description', 'header', 'body', 'footer', 'classes', 'children'],
  )

  const popupLayout = () => {
    if (behaviorProps.fullscreen) {
      return 'fullscreen'
    }

    if (behaviorProps.scrollable) {
      return 'scrollable'
    }

    return 'default'
  }

  const headerContent = () => {
    if (contentProps.header) {
      return contentProps.header
    }

    if (!contentProps.title && !contentProps.description && !behaviorProps.close) {
      return undefined
    }

    return (
      <>
        <Show when={contentProps.title || contentProps.description}>
          <div
            data-slot="wrapper"
            class={cn('min-w-0 flex-1 grid gap-1.5', contentProps.classes?.wrapper)}
          >
            <Show when={contentProps.title}>
              <KobalteDialog.Title
                data-slot="title"
                class={cn(
                  'text-lg font-semibold leading-none tracking-tight',
                  contentProps.classes?.title,
                )}
              >
                {contentProps.title}
              </KobalteDialog.Title>
            </Show>

            <Show when={contentProps.description}>
              <KobalteDialog.Description
                data-slot="description"
                class={cn('text-sm text-muted-foreground', contentProps.classes?.description)}
              >
                {contentProps.description}
              </KobalteDialog.Description>
            </Show>
          </div>
        </Show>

        <Show when={behaviorProps.close}>
          <KobalteDialog.CloseButton
            as={IconButton}
            name={behaviorProps.closeIcon}
            data-slot="close"
            aria-label="Close"
            class={cn(
              'absolute right-4 top-4 size-7 p-1 rounded-sm hover:bg-accent focus-visible:effect-fv transition-opacity',
              contentProps.classes?.close,
            )}
          />
        </Show>
      </>
    )
  }

  return (
    <Popup
      overlay={behaviorProps.overlay}
      scrollable={behaviorProps.scrollable}
      transition={behaviorProps.transition}
      fullscreen={behaviorProps.fullscreen}
      dismissible={behaviorProps.dismissible}
      onClosePrevent={behaviorProps.onClosePrevent}
      classes={{
        trigger: contentProps.classes?.trigger,
        overlay: contentProps.classes?.overlay,
        content: contentProps.classes?.content,
      }}
      content={
        <Card
          header={headerContent()}
          footer={contentProps.footer}
          classes={{
            root: dialogCardVariants({ layout: popupLayout() }),
            header: cn('flex items-start gap-1.5 p-6', contentProps.classes?.header),
            body: cn('pb-6 text-sm', contentProps.classes?.body),
            footer: cn(
              'flex flex-col-reverse gap-2 px-6 pb-6 pt-0 sm:(flex-row justify-end)',
              contentProps.classes?.footer,
            ),
          }}
        >
          {contentProps.body}
        </Card>
      }
      {...restProps}
    >
      {contentProps.children}
    </Popup>
  )
}
