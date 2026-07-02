import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { Modal } from '../base/modal'
import type { ModalProps } from '../base/modal'

import { sheetContentVariants } from './sheet.class'
import type { SheetVariantProps } from './sheet.class'

export namespace SheetT {
  export interface Slot<T = unknown> {
    /** Element users activate to open the sheet. */
    trigger?: T

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

  export type Variant = SheetVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Sheet component.
   */
  export interface Base extends Pick<
    ModalProps,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'overlay' | 'dismissible' | 'onClosePrevent'
  > {
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
    actions?: JSX.Element

    /**
     * Trigger element that opens the sheet.
     */
    children: JSX.Element
  }

  /**
   * Props for the Sheet component.
   */
  export interface Props extends BaseProps<Base, Variant, never, Classes, Styles> {}
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
  const rootId = useId(() => merged.id, 'sheet')
  const titleId = createMemo(() => (merged.title ? `${rootId()}-title` : undefined))
  const descriptionId = createMemo(() =>
    merged.description ? `${rootId()}-description` : undefined,
  )

  const hasDefaultHeader = () =>
    Boolean(merged.title || merged.description || merged.actions || merged.close)

  return (
    <Modal
      id={merged.id}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      overlay={merged.overlay}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      trigger={merged.children}
      classes={{
        trigger: cn(merged.classes?.trigger, merged.class),
        overlay: cn(
          'bg-black/10 duration-150 inset-0 fixed z-50 backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in',
          merged.classes?.overlay,
        ),
        content: sheetContentVariants(
          {
            side: merged.side,
            inset: merged.inset,
          },
          !merged.transition &&
            'transition-none data-expanded:animate-none data-closed:animate-none',
          merged.classes?.content,
        ),
      }}
      styles={{
        trigger: { ...merged.styles?.trigger, ...merged.style },
        overlay: merged.styles?.overlay,
        content: merged.styles?.content,
      }}
      contentAttributes={{ 'data-side': merged.side }}
      ariaLabelledBy={titleId()}
      ariaDescribedBy={descriptionId()}
      content={({ close }) => (
        <>
          <Show when={merged.header || hasDefaultHeader()}>
            <div
              data-slot="header"
              style={merged.styles?.header}
              class={cn('p-4 flex gap-2 items-start', merged.classes?.header)}
            >
              <Show
                when={merged.header}
                fallback={
                  <>
                    <div
                      data-slot="wrapper"
                      style={merged.styles?.wrapper}
                      class={cn('flex-1 gap-0.5 grid min-w-0', merged.classes?.wrapper)}
                    >
                      <Show when={merged.title}>
                        <h2
                          id={titleId()}
                          data-slot="title"
                          style={merged.styles?.title}
                          class={cn('text-base text-foreground font-medium', merged.classes?.title)}
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

                    <Show when={merged.actions}>
                      <div
                        data-slot="actions"
                        style={merged.styles?.actions}
                        class={cn(
                          'ms-auto inline-flex shrink-0 gap-2 items-center',
                          merged.classes?.actions,
                        )}
                      >
                        {merged.actions}
                      </div>
                    </Show>

                    <Show when={merged.close !== false}>
                      <button
                        type="button"
                        data-slot="close"
                        style={merged.styles?.close}
                        class={cn(
                          'text-muted-foreground border border-transparent rounded-md inline-flex shrink-0 size-8 transition-colors items-center justify-center hover:(text-accent-foreground bg-accent) focus-visible:effect-fv-border',
                          merged.classes?.close,
                        )}
                        aria-label="Close"
                        onClick={() => {
                          close()
                        }}
                      >
                        <Show when={merged.close === true} fallback={merged.close}>
                          <Icon name="icon-close" />
                        </Show>
                      </button>
                    </Show>
                  </>
                }
              >
                {merged.header}
              </Show>
            </div>
          </Show>

          <Show when={merged.body}>
            <div
              data-slot="body"
              style={merged.styles?.body}
              class={cn(
                'flex-1 overflow-auto',
                (merged.header || hasDefaultHeader()) && 'px-4 pb-4 pt-0',
                merged.classes?.body,
              )}
            >
              {merged.body}
            </div>
          </Show>

          <Show when={merged.footer}>
            <div
              data-slot="footer"
              style={merged.styles?.footer}
              class={cn('mt-auto p-4 flex flex-col gap-2', merged.classes?.footer)}
            >
              {merged.footer}
            </div>
          </Show>
        </>
      )}
    />
  )
}
