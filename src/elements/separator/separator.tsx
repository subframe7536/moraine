import * as KobalteSeparator from '@kobalte/core/separator'
import type { JSX } from 'solid-js'
import { Show, mergeProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'

import type { SeparatorVariantProps } from './separator.class'
import {
  separatorBorderVariants,
  separatorContainerVariants,
  separatorRootVariants,
} from './separator.class'

export namespace SeparatorT {
  export type Slot = 'root' | 'border' | 'container'
  export type Variant = SeparatorVariantProps
  export interface Items {}
  export type Extend = KobalteSeparator.SeparatorRootProps<HTMLDivElement>
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
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
  }

  /**
   * Props for the Separator component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
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
    <KobalteSeparator.Root
      as="div"
      orientation={merged.orientation}
      aria-hidden={merged.decorative ? true : undefined}
      data-slot="root"
      style={merged.styles?.root}
      class={separatorRootVariants(
        {
          orientation: merged.orientation,
        },
        merged.classes?.root,
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
          data-slot="container"
          style={merged.styles?.container}
          class={separatorContainerVariants(
            {
              orientation: merged.orientation,
            },
            merged.classes?.container,
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
    </KobalteSeparator.Root>
  )
}
