import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { ModalContent, ModalRoot, ModalTrigger } from '../base/modal.tsx'
import type { ModalContentContext, ModalRootProps } from '../base/modal.tsx'
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

  export type Variant = SheetVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Sheet component.
   */
  export interface Base extends Pick<
    ModalRootProps,
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

    classes?: Classes
    styles?: Styles

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
  export type Props = Base & Variant
}

/**
 * Props for the Sheet component.
 */
export type SheetProps = SheetT.Props

type SheetRuntimeProps = SheetT.Base &
  SheetT.Variant & {
    classes?: SheetT.Classes
    styles?: SheetT.Styles
  }

/** Slide-in panel overlay from any screen edge with header, body, and footer slots. */
export function Sheet(props: SheetProps): JSX.Element {
  const [local] = splitProps(props as SheetRuntimeProps, [
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
  const rootId = useId(() => merged.id, 'sheet')
  const isPresent = (value: JSX.Element): boolean =>
    value !== undefined && value !== null && value !== false
  const hasCustomHeader = createLazyMemo(() => isPresent(header()))
  const titleId = createLazyMemo(() =>
    !hasCustomHeader() && isPresent(title()) ? `${rootId()}-title` : undefined,
  )
  const descriptionId = createLazyMemo(() =>
    !hasCustomHeader() && isPresent(description()) ? `${rootId()}-description` : undefined,
  )

  const hasDefaultHeader = () =>
    isPresent(title()) ||
    isPresent(description()) ||
    isPresent(action()) ||
    closeContent() !== false

  return (
    <ModalRoot
      id={merged.id}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      onExitComplete={merged.onExitComplete}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      hasOverlay={merged.overlay}
      hasContent
    >
      <ModalTrigger children={triggerRender()} />
      <ModalContent
        overlay={merged.overlay}
        overlayClass={cn(
          'bg-black/10 duration-150 inset-0 fixed z-50 backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in',
          merged.classes?.overlay,
        )}
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
        contentRender={(props: ModalContentContext): JSX.Element => (
          <>
            <Show when={hasCustomHeader() || hasDefaultHeader()}>
              <div
                data-slot="header"
                style={merged.styles?.header}
                class={cn('p-4 flex gap-2 items-start', merged.classes?.header)}
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
                        <Show when={isPresent(title())}>
                          <h2
                            id={titleId()}
                            data-slot="title"
                            style={merged.styles?.title}
                            class={cn(
                              'text-base text-foreground font-medium',
                              merged.classes?.title,
                            )}
                          >
                            {title()}
                          </h2>
                        </Show>

                        <Show when={isPresent(description())}>
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

                      <Show when={isPresent(action())}>
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
                        <button
                          type="button"
                          data-slot="close"
                          style={merged.styles?.close}
                          class={cn(
                            'text-muted-foreground border border-transparent rounded-md inline-flex shrink-0 size-8 transition-colors items-center justify-center hover:(text-accent-foreground bg-accent-hover) focus-visible:effect-fv-border active:bg-accent-active',
                            merged.classes?.close,
                          )}
                          aria-label="Close"
                          onClick={() => {
                            props.close()
                          }}
                        >
                          <Show when={closeContent() === true} fallback={closeContent()}>
                            <Icon name="icon-close" />
                          </Show>
                        </button>
                      </Show>
                    </>
                  }
                >
                  {header()}
                </Show>
              </div>
            </Show>

            <Show when={isPresent(body())}>
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

            <Show when={isPresent(footer())}>
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
    </ModalRoot>
  )
}
