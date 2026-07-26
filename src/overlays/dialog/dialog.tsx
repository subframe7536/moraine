import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps } from 'solid-js'

import { Card } from '../../elements/card'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { Modal } from '../base/modal'
import type { ModalProps } from '../base/modal'
import { popupContentVariants, popupOverlayVariants } from '../popup/popup.class'

import { dialogCardVariants } from './dialog.class'
import type { DialogCardVariantProps } from './dialog.class'

export namespace DialogT {
  export interface Slot<T = unknown> {
    /** Element users activate to open the dialog. */
    trigger?: T

    /** Backdrop layer rendered behind the dialog panel. */
    overlay?: T

    /** Dialog panel containing header, body, footer, and close control. */
    content?: T

    /** Top region for dialog title and description. */
    header?: T

    /** Inner card wrapper that arranges dialog header, body, and footer. */
    wrapper?: T

    /** Accessible title for the dialog. */
    title?: T

    /** Supporting text associated with the dialog title. */
    description?: T

    /** Button that dismisses the dialog. */
    close?: T

    /** Main dialog content region. */
    body?: T

    /** Bottom region for dialog actions. */
    footer?: T
  }

  export type Variant = DialogCardVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Dialog component.
   */
  export interface Base extends Pick<
    ModalProps,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'overlay' | 'dismissible' | 'onClosePrevent'
  > {
    /**
     * Primary title displayed in the dialog header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

    /**
     * Whether the dialog content body should be scrollable.
     * @default false
     */
    scrollable?: boolean

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
     * Icon name or custom content for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name | JSX.Element

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
     * Content to render inside the dialog trigger slot.
     */
    children: JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
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
      close: true,
      closeIcon: 'icon-close' as IconT.Name,
      dismissible: true,
    },
    props,
  )
  const rootId = useId(() => merged.id, 'dialog')
  const titleId = createMemo(() => (merged.title ? `${rootId()}-title` : undefined))
  const descriptionId = createMemo(() =>
    merged.description ? `${rootId()}-description` : undefined,
  )

  const popupLayout = () => {
    if (merged.fullscreen) {
      return 'fullscreen'
    }

    if (merged.scrollable) {
      return 'scrollable'
    }

    return 'default'
  }

  const headerContent = (close: () => void) => {
    if (merged.header) {
      return merged.header
    }

    if (!merged.title && !merged.description && !merged.close) {
      return undefined
    }

    return (
      <>
        <Show when={merged.title || merged.description}>
          <div
            data-slot="wrapper"
            style={merged.styles?.wrapper}
            class={cn('flex-1 gap-1.5 grid min-w-0', merged.classes?.wrapper)}
          >
            <Show when={merged.title}>
              <h2
                id={titleId()}
                data-slot="title"
                style={merged.styles?.title}
                class={cn(
                  'text-lg leading-none tracking-tight font-semibold',
                  merged.classes?.title,
                )}
              >
                {merged.title}
              </h2>
            </Show>

            <Show when={merged.description}>
              <p
                id={descriptionId()}
                data-slot="description"
                style={merged.styles?.description}
                class={cn('text-sm text-muted-foreground', merged.classes?.description)}
              >
                {merged.description}
              </p>
            </Show>
          </div>
        </Show>

        <Show when={merged.close}>
          <button
            type="button"
            data-slot="close"
            aria-label="Close"
            style={merged.styles?.close}
            class={cn(
              'text-muted-foreground p-1 rounded-sm inline-flex shrink-0 size-7 cursor-pointer transition-colors items-center right-4 top-4 justify-center absolute focus-visible:effect-fv active:bg-accent-active hover:bg-accent-hover',
              merged.classes?.close,
            )}
            onClick={() => {
              close()
            }}
          >
            <Icon name={merged.closeIcon} />
          </button>
        </Show>
      </>
    )
  }

  return (
    <Modal
      id={merged.id}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      overlay={merged.overlay}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      preventScroll={!merged.scrollable}
      trigger={merged.children}
      classes={{
        trigger: cn(merged.classes?.trigger, merged.class),
        overlay: popupOverlayVariants(
          {
            scrollable: merged.scrollable,
          },
          merged.classes?.overlay,
        ),
        content: popupContentVariants(
          {
            layout: popupLayout(),
          },
          merged.classes?.content,
        ),
      }}
      styles={{
        trigger: { ...merged.styles?.trigger, ...merged.style },
        overlay: merged.styles?.overlay,
        content: merged.styles?.content,
      }}
      ariaLabelledBy={titleId()}
      ariaDescribedBy={descriptionId()}
      content={(context) => (
        <Card
          header={headerContent(context.close)}
          footer={merged.footer}
          classes={{
            root: dialogCardVariants({ layout: popupLayout() }),
            header: ['p-6 flex gap-1.5 items-start', merged.classes?.header],
            body: ['text-sm', merged.classes?.body],
            footer: [
              'px-6 pb-6 pt-0 flex flex-col-reverse gap-2 sm:(flex-row justify-end)',
              merged.classes?.footer,
            ],
          }}
        >
          {merged.body}
        </Card>
      )}
    />
  )
}
