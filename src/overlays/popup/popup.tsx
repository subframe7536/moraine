import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { hasJsxContent } from '../../shared/jsx-content.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { ModalContent, ModalRoot, ModalTrigger } from '../base/modal.tsx'
import type { ModalContentContext, ModalRootProps } from '../base/modal.tsx'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { popupContentVariants, popupOverlayVariants } from './popup.class.ts'
import type { PopupVariantProps } from './popup.class.ts'

export namespace PopupT {
  export interface Slot<T = unknown> {
    /** Optional backdrop layer rendered behind popup content. */
    overlay?: T

    /** Positioned popup content panel. */
    content?: T

    /** Accessible title rendered inside the popup content panel. */
    title?: T

    /** Supporting text associated with the popup title. */
    description?: T
  }

  export type Variant = PopupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Popup component.
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

    /** Modal content rendered inside the content surface. */
    content?: ComponentOrElement<ModalContentContext>

    /** Accessible title rendered inside the content surface. */
    title?: JSX.Element

    /** Supporting text rendered below the title. */
    description?: JSX.Element

    /** Accessible name used when the popup has no rendered title. */
    ariaLabel?: string

    /**
     * Whether to allow scrolling within the popup.
     * @default false
     */
    scrollable?: boolean

    /**
     * Whether the popup should cover the entire viewport.
     * @default false
     */
    fullscreen?: boolean

    classes?: Classes
    styles?: Styles

    /** Render the popup trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Popup component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = Base & Variant
}

/**
 * Props for the Popup component.
 */
export type PopupProps = PopupT.Props

type PopupRuntimeProps = PopupT.Base & {
  classes?: PopupT.Classes
  styles?: PopupT.Styles
}

/** Low-level overlay primitive providing portal, overlay backdrop, and content positioning. */
export function Popup(props: PopupProps): JSX.Element {
  const [local] = splitProps(props as PopupRuntimeProps, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onExitComplete',
    'overlay',
    'dismissible',
    'onClosePrevent',
    'content',
    'title',
    'description',
    'ariaLabel',
    'scrollable',
    'fullscreen',
    'children',
    'classes',
    'styles',
  ])
  const merged = mergeProps(
    {
      overlay: true,
      dismissible: true,
    },
    local,
  )
  const content = createMemo(() => merged.content)
  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const rootId = useId(() => merged.id, 'popup')
  const hasTitle = createLazyMemo(() => hasJsxContent(title()))
  const hasDescription = createLazyMemo(() => hasJsxContent(description()))
  const titleId = createLazyMemo(() => (hasTitle() ? `${rootId()}-title` : undefined))
  const descriptionId = createLazyMemo(() =>
    hasDescription() ? `${rootId()}-description` : undefined,
  )
  const hasContent = createMemo(() => hasJsxContent(content()) || hasTitle() || hasDescription())

  const renderContent = (context: ModalContentContext): JSX.Element => (
    <>
      <Show when={hasTitle()}>
        <h2
          id={titleId()}
          data-slot="title"
          style={merged.styles?.title}
          class={cn(merged.classes?.title)}
        >
          {title()}
        </h2>
      </Show>
      <Show when={hasDescription()}>
        <p
          id={descriptionId()}
          data-slot="description"
          style={merged.styles?.description}
          class={cn(merged.classes?.description)}
        >
          {description()}
        </p>
      </Show>
      <Show when={hasJsxContent(content())}>{renderComponentOrElement(content()!, context)}</Show>
    </>
  )

  const contentLayout = () => {
    if (merged.fullscreen) {
      return 'fullscreen'
    }

    if (merged.scrollable) {
      return 'scrollable'
    }

    return 'default'
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
      hasContent={hasContent()}
    >
      <ModalTrigger children={merged.children} />
      <Show when={hasContent()}>
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
              layout: contentLayout(),
            },
            merged.classes?.content,
          )}
          style={merged.styles?.content}
          ariaLabel={hasTitle() ? undefined : merged.ariaLabel}
          ariaLabelledBy={titleId()}
          ariaDescribedBy={descriptionId()}
          contentRender={renderContent}
        />
      </Show>
    </ModalRoot>
  )
}
