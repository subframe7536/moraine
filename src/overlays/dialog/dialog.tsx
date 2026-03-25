import * as KobalteDialog from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Card } from '../../elements/card'
import { IconButton } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { Popup } from '../popup'

import { dialogCardVariants } from './dialog.class'
import type { DialogCardVariantProps } from './dialog.class'

export namespace DialogT {
  export type Slot =
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

  export type Variant = DialogCardVariantProps
  export interface Items {}
  export type Extend = KobalteDialog.DialogRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Dialog component.
   */
  export interface Base {
    /**
     * Unique identifier for the dialog.
     */
    id?: string

    /**
     * Controlled open state of the dialog.
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
     * Primary title displayed in the dialog header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

    /**
     * Whether to show a background overlay.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether the dialog content body should be scrollable.
     * @default false
     */
    scrollable?: boolean

    /**
     * Whether to enable transition animations.
     * @default true
     */
    transition?: boolean

    /**
     * Whether the dialog should take up the full viewport.
     * @default false
     */
    fullscreen?: boolean

    /**
     * Whether to show a close button.
     * @default true
     */
    close?: boolean

    /**
     * Icon name for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name

    /**
     * Whether the dialog can be dismissed by clicking outside or pressing Escape.
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
     * Custom element to render in the body slot.
     */
    body?: JSX.Element

    /**
     * Custom element to render in the footer slot.
     */
    footer?: JSX.Element

    /**
     * Slot-based class overrides.
     */
    classes?: Classes

    /**
     * Slot-based style overrides.
     */
    styles?: Styles

    /**
     * Content to render inside the dialog.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Dialog component.
 */
export interface DialogProps extends DialogT.Props {}

/** Modal dialog with header, body, and footer slots, backdrop overlay, and dismissal control. */
export function Dialog(props: DialogProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      close: true,
      closeIcon: 'icon-close',
      dismissible: true,
    },
    props,
  ) as DialogProps
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
            style={merged.styles?.wrapper}
            class={cn('flex-1 gap-1.5 grid min-w-0', contentProps.classes?.wrapper)}
          >
            <Show when={contentProps.title}>
              <KobalteDialog.Title
                data-slot="title"
                style={merged.styles?.title}
                class={cn(
                  'text-lg leading-none tracking-tight font-semibold',
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
            style={merged.styles?.close}
            aria-label="Close"
            class={cn(
              'p-1 rounded-sm size-7 transition-opacity right-4 top-4 absolute focus-visible:effect-fv hover:bg-accent',
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
            header: cn('p-6 flex gap-1.5 items-start', contentProps.classes?.header),
            body: cn('text-sm pb-6', contentProps.classes?.body),
            footer: cn(
              'px-6 pb-6 pt-0 flex flex-col-reverse gap-2 sm:(flex-row justify-end)',
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
