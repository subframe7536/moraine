import type { JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
import { Modal } from '../base/modal'
import type { ModalProps } from '../base/modal'

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
    ModalProps,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'overlay'
    | 'dismissible'
    | 'onClosePrevent'
    | 'content'
  > {
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
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the Popup component.
 */
export interface PopupProps extends PopupT.Props {}

/** Low-level overlay primitive providing portal, overlay backdrop, and content positioning. */
export function Popup(props: PopupProps): JSX.Element {
  const merged = mergeProps(
    {
      overlay: true,
      dismissible: true,
    },
    props,
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
            layout: contentLayout(),
          },
          merged.classes?.content,
        ),
      }}
      styles={{
        trigger: { ...merged.styles?.trigger, ...merged.style },
        overlay: merged.styles?.overlay,
        content: merged.styles?.content,
      }}
      content={merged.content}
    />
  )
}
