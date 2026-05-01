import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

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
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'horizontal' | 'vertical'
  }

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

  const [local, rest] = splitProps(merged, [
    'children',
    'classes',
    'decorative',
    'orientation',
    'size',
    'styles',
    'type',
  ])

  return (
    <div
      role="separator"
      data-orientation={local.orientation}
      aria-orientation={local.orientation === 'vertical' ? 'vertical' : undefined}
      aria-hidden={local.decorative ? true : undefined}
      data-slot="root"
      style={local.styles?.root}
      class={separatorRootVariants(
        {
          orientation: local.orientation,
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <div
        data-slot="border"
        style={local.styles?.border}
        class={separatorBorderVariants(
          {
            orientation: local.orientation,
            size: local.size,
            type: local.type,
          },
          local.classes?.border,
        )}
      />

      <Show when={local.children}>
        <div
          data-slot="container"
          style={local.styles?.container}
          class={separatorContainerVariants(
            {
              orientation: local.orientation,
            },
            local.classes?.container,
          )}
        >
          {local.children}
        </div>
        <div
          data-slot="border"
          style={local.styles?.border}
          class={separatorBorderVariants(
            {
              orientation: local.orientation,
              size: local.size,
              type: local.type,
            },
            local.classes?.border,
          )}
        />
      </Show>
    </div>
  )
}
