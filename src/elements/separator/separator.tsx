import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps } from '../../shared/types.ts'

import type { SeparatorVariantProps } from './separator.class.ts'
import { separatorRecipe } from './separator.class.ts'

export namespace SeparatorT {
  export interface Slot<_T = unknown> {}
  export type Variant = SeparatorVariantProps
  export type Classes = never
  export type Styles = never

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
  const config = useMoraineConfig()
  const provider = () => config().separator

  const [local, rest] = splitProps(props, [
    'decorative',
    'orientation',
    'size',
    'type',
    'class',
    'style',
    'children',
  ])

  const orientation = createMemo<NonNullable<SeparatorVariantProps['orientation']>>(
    () => local.orientation ?? provider()?.variants?.orientation ?? 'horizontal',
  )
  const size = createMemo<NonNullable<SeparatorVariantProps['size']>>(
    () => local.size ?? provider()?.variants?.size ?? 'sm',
  )
  const type = createMemo<NonNullable<SeparatorVariantProps['type']>>(
    () => local.type ?? provider()?.variants?.type ?? 'solid',
  )

  const resolved = resolveComponentStyle({
    base: {
      get classes() {
        return {
          root: separatorRecipe({
            orientation: orientation(),
            size: size(),
            type: type(),
          }),
        }
      },
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        style: local.style,
      }
    },
  })

  return (
    <div
      role="separator"
      data-slot="root"
      data-orientation={orientation()}
      aria-orientation={orientation()}
      aria-hidden={local.decorative ? true : undefined}
      {...rest}
      {...resolved.rootClassAndStyle()}
    />
  )
}
