import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
import { ModalContent, ModalRoot, ModalTrigger } from '../base/modal'
import type { ModalContentContext, ModalRootProps } from '../base/modal'

import { popupContentVariants, popupOverlayVariants } from './popup.class'
import type { PopupVariantProps } from './popup.class'

export namespace PopupT {
  export interface Slot<T = unknown> {
    /** Element users activate to open the popup. */
    trigger?: T

    /** Optional backdrop layer rendered behind popup content. */
    overlay?: T

    /** Positioned popup content panel. */
    content?: T
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

    /**
     * Element that triggers the popup or additional content.
     */
    children: JSX.Element
  }

  /**
   * Props for the Popup component.
   */
  export type Props = BaseProps<'span', Base, Variant, Slot>
}

/**
 * Props for the Popup component.
 */
export interface PopupProps extends PopupT.Props {}

/** Low-level overlay primitive providing portal, overlay backdrop, and content positioning. */
export function Popup(props: PopupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onExitComplete',
    'overlay',
    'dismissible',
    'onClosePrevent',
    'content',
    'scrollable',
    'fullscreen',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const merged = mergeProps(
    {
      overlay: true,
      dismissible: true,
    },
    local,
  )
  const content = createMemo(() => merged.content)

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
      hasContent={Boolean(content())}
    >
      <ModalTrigger
        {...rest}
        class={cn(merged.classes?.trigger, merged.class)}
        style={{ ...merged.styles?.trigger, ...merged.style }}
      >
        {merged.children}
      </ModalTrigger>
      <Show when={content()}>
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
          contentRender={content()!}
        />
      </Show>
    </ModalRoot>
  )
}
