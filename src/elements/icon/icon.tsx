import type { Component, JSX, ValidComponent } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { BaseProps } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace IconT {
  export type Name = string | JSX.Element | Component<Omit<IconProps, 'name'>>

  export interface Slot<_T = unknown> {}
  export type Variant = never
  export type Classes = never
  export type Styles = never

  export interface Item {}
  /**
   * Base props for the Icon component.
   */
  export interface Base {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
     * or app-config aliases such as `icon-search`.
     * Non-string values can be JSX nodes or render functions.
     */
    name: Name

    /**
     * Explicit icon size override. Omit to inherit the surrounding font size.
     * Numbers are interpreted as px.
     */
    size?: string | number

    /**
     * Data slot for styling.
     * @default 'icon'
     */
    slotName?: string
  }

  /**
   * Props for the Icon component.
   */
  export type Props = BaseProps<'div', Base, Variant>
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends IconT.Props {}

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])
  const name = createMemo(() => local.name)
  const componentProps = createMemo<{ component: ValidComponent; class: string | undefined }>(
    () => {
      const value = name()

      if (typeof value === 'string') {
        return { component: 'div', class: cn(value, local.class) }
      }

      return {
        component: typeof value === 'function' ? value : () => value,
        class: cn(local.class),
      }
    },
  )

  return (
    <Dynamic
      data-slot={local.slotName ?? 'icon'}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
      {...componentProps()}
      style={{
        'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
        ...local.style,
      }}
    />
  )
}
