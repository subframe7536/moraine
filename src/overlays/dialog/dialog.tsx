import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Card } from '../../elements/card/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { ModalContent, ModalRoot, ModalTrigger } from '../base/modal.tsx'
import type { ModalRootProps } from '../base/modal.tsx'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import { popupContentVariants, popupOverlayVariants } from '../popup/popup.class.ts'

import { dialogCardVariants } from './dialog.class.ts'
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

  export type Variant = DialogCardVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Dialog component.
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

    /** Render the dialog trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = Base & Variant
}

/**
 * Props for the Dialog component.
 */
export type DialogProps = DialogT.Props

type DialogRuntimeProps = DialogT.Base & {
  classes?: DialogT.Classes
  styles?: DialogT.Styles
}

/** Modal dialog with header, body, and footer slots, backdrop overlay, and dismissal control. */
export function Dialog(props: DialogProps): JSX.Element {
  const [local] = splitProps(props as DialogRuntimeProps, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onExitComplete',
    'overlay',
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
  const title = createMemo(() => merged.title)
  const description = createMemo(() => merged.description)
  const header = createMemo(() => merged.header)
  const rootId = useId(() => merged.id, 'dialog')
  const titleId = createMemo(() => (title() ? `${rootId()}-title` : undefined))
  const descriptionId = createMemo(() => (description() ? `${rootId()}-description` : undefined))

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
    if (header()) {
      return header()
    }

    if (!title() && !description() && !merged.close) {
      return undefined
    }

    return (
      <>
        <Show when={title() || description()}>
          <div
            data-slot="wrapper"
            style={merged.styles?.wrapper}
            class={cn('flex-1 gap-1.5 grid min-w-0', merged.classes?.wrapper)}
          >
            <Show when={title()}>
              <h2
                id={titleId()}
                data-slot="title"
                style={merged.styles?.title}
                class={cn(
                  'text-lg leading-none tracking-tight font-semibold',
                  merged.classes?.title,
                )}
              >
                {title()}
              </h2>
            </Show>

            <Show when={description()}>
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
    <ModalRoot
      id={merged.id}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      onExitComplete={merged.onExitComplete}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      preventScroll={!merged.scrollable}
      hasOverlay={merged.overlay}
      hasContent
    >
      <ModalTrigger children={merged.children} />
      <ModalContent
        overlay={merged.overlay}
        overlayClass={popupOverlayVariants(
          {
            scrollable: merged.scrollable,
          },
          merged.classes?.overlay,
        )}
        overlayStyle={merged.styles?.overlay}
        class={popupContentVariants(
          {
            layout: popupLayout(),
          },
          merged.classes?.content,
        )}
        style={merged.styles?.content}
        ariaLabelledBy={titleId()}
        ariaDescribedBy={descriptionId()}
        contentRender={(context) => (
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
    </ModalRoot>
  )
}
