import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { Button } from '../../elements/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { hasJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import { ModalTriggerRenderer } from '../modal/modal-trigger.tsx'
import { MODAL_OVERLAY_CLASS } from '../modal/modal.class.ts'
import { Modal } from '../modal/modal.tsx'
import type { ModalProps } from '../modal/modal.tsx'

import {
  DIALOG_BODY_CLASS,
  DIALOG_CLOSE_CLASS,
  DIALOG_CONTENT_CLASS,
  DIALOG_CONTENT_FULLSCREEN_CLASS,
  DIALOG_CONTENT_SCROLLABLE_CLASS,
  DIALOG_DESCRIPTION_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_TITLE_CLASS,
  DIALOG_WRAPPER_CLASS,
} from './dialog.class.ts'

export namespace DialogT {
  export interface Slot<T = unknown> {
    /** Element that opens the dialog. */
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

  export type Variant = never
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
     * Whether the dialog should take up the full viewport.
     * @default false
     */
    fullscreen?: boolean

    /** Whether the overlay should scroll the complete dialog panel. */
    scrollable?: boolean

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
    'fullscreen',
    'scrollable',
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
  const moraine = useMoraineConfig()
  const providerDialog = () => moraine().dialog

  const merged = mergeProps(
    {
      overlay: true,
      close: true,
      closeIcon: 'icon-close' as const,
      dismissible: true,
    },
    local,
  )

  const resolved = resolveComponentStyle({
    get provider() {
      return providerDialog()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const header = createLazyMemo(() => merged.header)
  const body = createLazyMemo(() => merged.body)
  const footer = createLazyMemo(() => merged.footer)
  const closeIcon = createLazyMemo(() => merged.closeIcon)
  const triggerRender = createMemo(() => merged.children)
  const triggerProps = mergeProps(rest as Partial<OverlayTriggerProps>, {
    get class() {
      return resolved.slotClass('trigger')
    },
    get style() {
      return resolved.slotStyle('trigger')
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
  const overlayScroll = () => Boolean(merged.scrollable && merged.overlay && !merged.fullscreen)

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
            {...resolved.slotClassAndStyle('wrapper', DIALOG_WRAPPER_CLASS, merged.close && 'pe-8')}
          >
            <Show when={hasJsxContent(title())}>
              <h2
                id={titleId()}
                data-slot="title"
                {...resolved.slotClassAndStyle('title', DIALOG_TITLE_CLASS)}
              >
                {title()}
              </h2>
            </Show>

            <Show when={hasJsxContent(description())}>
              <p
                id={descriptionId()}
                data-slot="description"
                {...resolved.slotClassAndStyle('description', DIALOG_DESCRIPTION_CLASS)}
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
            {...resolved.slotClassAndStyle('close', DIALOG_CLOSE_CLASS)}
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
      <ModalTriggerRenderer {...triggerProps}>{triggerRender()}</ModalTriggerRenderer>
      <Modal.Content
        overlay={merged.overlay}
        overlayScroll={overlayScroll()}
        overlayClass={cn(MODAL_OVERLAY_CLASS, resolved.slotClass('overlay'))}
        overlayStyle={resolved.slotStyle('overlay')}
        class={cn(
          merged.fullscreen
            ? DIALOG_CONTENT_FULLSCREEN_CLASS
            : overlayScroll()
              ? DIALOG_CONTENT_SCROLLABLE_CLASS
              : DIALOG_CONTENT_CLASS,
          resolved.slotClass('content'),
        )}
        style={resolved.slotStyle('content')}
        ariaLabel={merged.ariaLabel}
        ariaLabelledBy={titleId()}
        ariaDescribedBy={descriptionId()}
      >
        {(context) => {
          const hasHeader = () =>
            hasCustomHeader() ||
            hasJsxContent(title()) ||
            hasJsxContent(description()) ||
            merged.close

          return (
            <>
              <Show when={headerContent(context.close)}>
                {(h) => (
                  <div
                    data-slot="header"
                    {...resolved.slotClassAndStyle('header', DIALOG_HEADER_CLASS)}
                  >
                    {h()}
                  </div>
                )}
              </Show>

              <Show when={body()}>
                {(content) => (
                  <div
                    data-slot="body"
                    {...resolved.slotClassAndStyle(
                      'body',
                      DIALOG_BODY_CLASS,
                      !overlayScroll() && 'overflow-y-auto',
                      !hasHeader() && 'pt-6',
                      hasJsxContent(footer()) ? 'pb-2' : 'pb-6',
                    )}
                  >
                    {content()}
                  </div>
                )}
              </Show>

              <Show when={footer()}>
                {(f) => (
                  <div
                    data-slot="footer"
                    {...resolved.slotClassAndStyle('footer', DIALOG_FOOTER_CLASS)}
                  >
                    {f()}
                  </div>
                )}
              </Show>
            </>
          )
        }}
      </Modal.Content>
    </Modal>
  )
}
