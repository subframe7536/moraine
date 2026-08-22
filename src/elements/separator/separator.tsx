import type { JSX } from 'solid-js'
import { createMemo, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { SeparatorVariantProps } from './separator.class.ts'
import { separatorVariants } from './separator.class.ts'

export namespace SeparatorT {
  export interface Slot<T = unknown> {
    /** Separator line. */
    root?: T
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
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'
  }

  /**
   * Props for the Separator component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Separator component.
 */
export interface SeparatorProps extends SeparatorT.Props {}

/** Visual divider with configurable orientation, style, and border type. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'decorative',
    'orientation',
    'size',
    'type',
    'classes',
    'styles',
    'class',
    'style',
    'children',
  ])
  const merged = mergeProps(
    {
      decorative: false,
      orientation: 'horizontal' as const,
      size: 'sm' as const,
      type: 'solid' as const,
    },
    local,
  )
  const orientation = createMemo(() => merged.orientation)

  return (
    <div
      role="separator"
      data-slot="root"
      data-orientation={orientation()}
      aria-orientation={orientation()}
      aria-hidden={merged.decorative ? true : undefined}
      {...rest}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={separatorVariants(
        {
          orientation: orientation(),
          size: merged.size,
          type: merged.type,
        },
        merged.classes?.root,
        merged.class,
      )}
    />
  )
}
