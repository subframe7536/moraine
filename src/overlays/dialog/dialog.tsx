import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Card } from '../../elements/card/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { Button } from '../../elements/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { hasJsxContent } from '../../shared/jsx-content.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { Modal } from '../base/modal.tsx'
import type { ModalProps } from '../base/modal.tsx'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { dialogCardVariants, dialogContentVariants } from './dialog.class.ts'
import type { DialogCardVariantProps } from './dialog.class.ts'

export namespace DialogT {
  export interface Slot<T = unknown> {
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

  export interface Variant extends DialogCardVariantProps {
    /**
     * Layout mode for the dialog panel.
     * @default 'default'
     */
    layout?: DialogCardVariantProps['layout']
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Dialog component.
   */
  export interface Base extends Pick<
    ModalProps,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'onExitComplete'
    | 'dismissible'
    | 'onClosePrevent'
  > {
    /** Whether to render the overlay element. */
    overlay?: boolean

    /** Accessible name used when the dialog has no rendered title. */
    ariaLabel?: string

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

    /** Render the dialog trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the Dialog component.
 */
export interface DialogProps extends DialogT.Props {}

/** Modal dialog with header, body, and footer slots, backdrop overlay, and dismissal control. */
export function Dialog(props: DialogProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onExitComplete',
    'overlay',
    'ariaLabel',
    'dismissible',
    'onClosePrevent',
    'title',
    'description',
    'scrollable',
    'fullscreen',
    'close',
    'closeIcon',
    'header',
    'body',
    'footer',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const merged = mergeProps(
    {
      overlay: true,
      close: true,
      closeIcon: 'icon-close' as IconT.Name,
      dismissible: true,
    },
    local,
  )
  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const header = createLazyMemo(() => merged.header)
  const body = createLazyMemo(() => merged.body)
  const footer = createLazyMemo(() => merged.footer)
  const closeIcon = createLazyMemo(() => merged.closeIcon)
  const triggerRender = createMemo(() => merged.children)
  const triggerProps = mergeProps(rest as Partial<OverlayTriggerProps>, {
    get class() {
      return cn(props.class)
    },
    get style() {
      return props.style
    },
  }) as Partial<OverlayTriggerProps>
  const rootId = useId(() => merged.id, 'dialog')
  const hasCustomHeader = createLazyMemo(() => hasJsxContent(header()))
  const titleId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(title()) ? `${rootId()}-title` : undefined,
  )
  const descriptionId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(description()) ? `${rootId()}-description` : undefined,
  )

  const dialogLayout = () => {
    if (merged.fullscreen) {
      return 'fullscreen'
    }

    if (merged.scrollable) {
      return 'scrollable'
    }

    return 'default'
  }

  const headerContent = (close: () => void) => {
    if (hasCustomHeader()) {
      return header()
    }

    if (!hasJsxContent(title()) && !hasJsxContent(description()) && !merged.close) {
      return undefined
    }

    return (
      <>
        <Show when={hasJsxContent(title()) || hasJsxContent(description())}>
          <div
            data-slot="wrapper"
            style={merged.styles?.wrapper}
            class={cn('flex-1 gap-1.5 grid min-w-0', merged.classes?.wrapper)}
          >
            <Show when={hasJsxContent(title())}>
              <h2
                id={titleId()}
                data-slot="title"
                style={merged.styles?.title}
                class={cn('leading-none font-medium', merged.classes?.title)}
              >
                {title()}
              </h2>
            </Show>

            <Show when={hasJsxContent(description())}>
              <p
                id={descriptionId()}
                data-slot="description"
                style={merged.styles?.description}
                class={cn('text-sm text-muted-foreground', merged.classes?.description)}
              >
                {description()}
              </p>
            </Show>
          </div>
        </Show>

        <Show when={merged.close}>
          <Button
            data-slot="close"
            aria-label="Close"
            size="icon-sm"
            variant="ghost"
            style={merged.styles?.close}
            class={['absolute top-4 right-4', merged.classes?.close]}
            onClick={() => close()}
          >
            <Icon name={closeIcon()} />
          </Button>
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
      onExitComplete={merged.onExitComplete}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
    >
      <Modal.Trigger children={triggerRender()} triggerProps={triggerProps} />
      <Modal.Content
        overlay={merged.overlay}
        overlayClass={cn(merged.classes?.overlay)}
        overlayStyle={merged.styles?.overlay}
        class={dialogContentVariants(
          {
            layout: dialogLayout(),
          },
          merged.classes?.content,
        )}
        style={merged.styles?.content}
        ariaLabel={merged.ariaLabel}
        ariaLabelledBy={titleId()}
        ariaDescribedBy={descriptionId()}
        contentRender={(context) => (
          <Card
            header={headerContent(context.close)}
            footer={footer()}
            classes={{
              root: dialogCardVariants({ layout: dialogLayout() }),
              header: ['p-6 flex gap-2 items-start', merged.classes?.header],
              body: ['text-sm', merged.classes?.body],
              footer: [
                'px-6 pb-6 pt-0 flex flex-col-reverse gap-2 sm:(flex-row justify-end)',
                merged.classes?.footer,
              ],
            }}
          >
            {body()}
          </Card>
        )}
      />
    </Modal>
  )
}
