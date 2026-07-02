import type { JSX } from 'solid-js'
import { Show, mergeProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { SeparatorVariantProps } from './separator.class'
import {
  separatorBorderVariants,
  separatorContentVariants,
  separatorRootVariants,
} from './separator.class'

export namespace SeparatorT {
  export interface Slot<T = unknown> {
    /**
     * Separator line container, including optional label content.
     */
    root?: T

    /** Visual line segment rendered around optional separator content. */
    border?: T

    /** Optional label or custom content rendered within the separator line. */
    content?: T
  }
  export type Variant = SeparatorVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the Separator component.
   */
  export interface Base {
    /**
     * Whether the separator is decorative (hidden from assistive technologies).
     * @default false
     */
    decorative?: boolean

    /**
     * Additional content to render inside the separator (usually between two borders).
     */
    children?: JSX.Element
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'
  }

  /**
   * Props for the Separator component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the Separator component.
 */
export interface SeparatorProps extends SeparatorT.Props {}

/** Visual divider with configurable orientation, style, and optional label content. */
export function Separator(props: SeparatorProps): JSX.Element {
  const merged = mergeProps(
    {
      decorative: false,
      orientation: 'horizontal' as const,
      size: 'xs' as const,
      type: 'solid' as const,
    },
    props,
  )

  return (
    <div
      role="separator"
      data-slot="root"
      data-orientation={merged.orientation}
      aria-orientation={merged.orientation === 'vertical' ? 'vertical' : undefined}
      aria-hidden={merged.decorative ? true : undefined}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={separatorRootVariants(
        { orientation: merged.orientation },
        merged.classes?.root,
        merged.class,
      )}
    >
      <div
        data-slot="border"
        style={merged.styles?.border}
        class={separatorBorderVariants(
          {
            orientation: merged.orientation,
            size: merged.size,
            type: merged.type,
          },
          merged.classes?.border,
        )}
      />

      <Show when={merged.children}>
        <div
          data-slot="content"
          style={merged.styles?.content}
          class={separatorContentVariants(
            {
              orientation: merged.orientation,
            },
            merged.classes?.content,
          )}
        >
          {merged.children}
        </div>
        <div
          data-slot="border"
          style={merged.styles?.border}
          class={separatorBorderVariants(
            {
              orientation: merged.orientation,
              size: merged.size,
              type: merged.type,
            },
            merged.classes?.border,
          )}
        />
      </Show>
    </div>
  )
}
