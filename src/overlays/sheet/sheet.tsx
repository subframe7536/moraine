import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { Button } from '../../elements/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { hasJsxContent } from '../../shared/jsx-content.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { Modal } from '../base/modal.tsx'
import type { ModalProps, ModalT } from '../base/modal.tsx'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { sheetContentVariants } from './sheet.class.ts'
import type { SheetVariantProps } from './sheet.class.ts'

export namespace SheetT {
  export interface Slot<T = unknown> {
    /** Backdrop layer rendered behind the sheet panel. */
    overlay?: T

    /** Slide-in panel containing header, body, footer, and close control. */
    content?: T

    /** Top region for sheet title and description. */
    header?: T

    /** Inner wrapper that arranges sheet header, body, footer, and actions. */
    wrapper?: T

    /** Accessible title for the sheet. */
    title?: T

    /** Supporting text associated with the sheet title. */
    description?: T

    /** Header action region, usually paired with the close control. */
    actions?: T

    /** Button that dismisses the sheet. */
    close?: T

    /** Main sheet content region. */
    body?: T

    /** Bottom region for sheet actions. */
    footer?: T
  }

  export interface Variant extends SheetVariantProps {
    /**
     * Edge of the viewport from which the sheet enters.
     * @default 'right'
     */
    side?: SheetVariantProps['side']

    /**
     * Whether to inset the sheet from the viewport on larger screens.
     * @default false
     */
    inset?: SheetVariantProps['inset']
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Sheet component.
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

    /** Accessible name used when the sheet has no rendered title. */
    ariaLabel?: string

    /**
     * Primary title displayed in the sheet header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

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
    action?: JSX.Element

    /** Render the sheet trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Sheet component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the Sheet component.
 */
export interface SheetProps extends SheetT.Props {}

/** Slide-in panel overlay from any screen edge with header, body, and footer slots. */
export function Sheet(props: SheetProps): JSX.Element {
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
    'side',
    'inset',
    'transition',
    'close',
    'header',
    'body',
    'footer',
    'action',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      side: 'right' as const,
      inset: false,
      close: true,
      dismissible: true,
    },
    local,
  )
  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const header = createLazyMemo(() => merged.header)
  const action = createLazyMemo(() => merged.action)
  const closeContent = createLazyMemo(() => merged.close)
  const body = createLazyMemo(() => merged.body)
  const footer = createLazyMemo(() => merged.footer)
  const triggerRender = createMemo(() => merged.children)
  const triggerProps = mergeProps(rest as Partial<OverlayTriggerProps>, {
    get class() {
      return cn(props.class)
    },
    get style() {
      return props.style
    },
  }) as Partial<OverlayTriggerProps>
  const rootId = useId(() => merged.id, 'sheet')
  const hasCustomHeader = createLazyMemo(() => hasJsxContent(header()))
  const titleId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(title()) ? `${rootId()}-title` : undefined,
  )
  const descriptionId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(description()) ? `${rootId()}-description` : undefined,
  )

  const hasDefaultHeader = () =>
    hasJsxContent(title()) ||
    hasJsxContent(description()) ||
    hasJsxContent(action()) ||
    closeContent() !== false

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
        contentAttributes={{ 'data-side': merged.side }}
        ariaLabel={merged.ariaLabel}
        ariaLabelledBy={titleId()}
        ariaDescribedBy={descriptionId()}
        class={sheetContentVariants(
          {
            side: merged.side,
            inset: merged.inset,
          },
          !merged.transition &&
            'transition-none data-expanded:animate-none data-closed:animate-none',
          merged.classes?.content,
        )}
        style={merged.styles?.content}
        contentRender={(props: ModalT.ContentContext): JSX.Element => (
          <>
            <Show when={hasCustomHeader() || hasDefaultHeader()}>
              <div
                data-slot="header"
                style={merged.styles?.header}
                class={cn('p-4 flex gap-1.5 items-start', merged.classes?.header)}
              >
                <Show
                  when={hasCustomHeader()}
                  fallback={
                    <>
                      <div
                        data-slot="wrapper"
                        style={merged.styles?.wrapper}
                        class={cn('flex-1 gap-0.5 grid min-w-0', merged.classes?.wrapper)}
                      >
                        <Show when={hasJsxContent(title())}>
                          <h2
                            id={titleId()}
                            data-slot="title"
                            style={merged.styles?.title}
                            class={cn('text-foreground font-medium', merged.classes?.title)}
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

                      <Show when={hasJsxContent(action())}>
                        <div
                          data-slot="actions"
                          style={merged.styles?.actions}
                          class={cn(
                            'ms-auto inline-flex shrink-0 gap-2 items-center',
                            merged.classes?.actions,
                          )}
                        >
                          {action()}
                        </div>
                      </Show>

                      <Show when={closeContent() !== false}>
                        <Button
                          data-slot="close"
                          aria-label="Close"
                          variant="ghost"
                          size="icon-sm"
                          style={merged.styles?.close}
                          class={['absolute top-4 right-4', merged.classes?.close]}
                          onClick={() => props.close()}
                        >
                          <Show when={closeContent() === true} fallback={closeContent()}>
                            <Icon name="icon-close" />
                          </Show>
                        </Button>
                      </Show>
                    </>
                  }
                >
                  {header()}
                </Show>
              </div>
            </Show>

            <Show when={hasJsxContent(body())}>
              <div
                data-slot="body"
                style={merged.styles?.body}
                class={cn(
                  'flex-1 overflow-auto',
                  (hasCustomHeader() || hasDefaultHeader()) && 'px-4 pb-4 pt-0',
                  merged.classes?.body,
                )}
              >
                {body()}
              </div>
            </Show>

            <Show when={hasJsxContent(footer())}>
              <div
                data-slot="footer"
                style={merged.styles?.footer}
                class={cn('mt-auto p-4 flex flex-col gap-2', merged.classes?.footer)}
              >
                {footer()}
              </div>
            </Show>
          </>
        )}
      />
    </Modal>
  )
}
