import type { Component, JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '../../shared/utils'

export namespace IconT {
  export type Name = string | JSX.Element | Component<Omit<IconProps, 'name'>>

  export interface Slot<_T = unknown> {}
  export type Variant = never
  export type Classes = never
  export type Styles = never
  export type Extend = never

  export interface Item {}
  /**
   * Base props for the Icon component.
   */
  export interface Base extends Omit<
    JSX.HTMLAttributes<HTMLElement>,
    'aria-hidden' | 'children' | 'style' | 'size' | 'class' | 'id'
  > {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
     * or app-config aliases such as `icon-search`.
     * Non-string values can be JSX nodes or render functions.
     */
    name: Name

    /**
     * Icon size. Numbers are interpreted as px.
     */
    size?: string | number

    /**
     * Data slot for styling.
     * @default 'icon'
     */
    slotName?: string

    /**
     * Custom style overrides.
     */
    style?: JSX.CSSProperties

    /**
     * Additional CSS class.
     */
    class?: string

    /**
     * Unique identifier.
     */
    id?: string
  }

  /**
   * Props for the Icon component.
   */
  export interface Props extends Base {}
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends IconT.Props {}

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])

  const style = createMemo(() => {
    if (!local.size) {
      return local.style
    }
    return {
      'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
      ...local.style,
    }
  })

  return (
    <Dynamic
      component={
        typeof local.name === 'string'
          ? 'div'
          : typeof local.name === 'function'
            ? local.name
            : () => local.name as JSX.Element
      }
      data-slot={local.slotName ?? 'icon'}
      class={cn(typeof local.name === 'string' && local.name, local.class)}
      style={style()}
      {...rest}
      aria-hidden={rest['aria-label'] ? undefined : true}
    />
  )
}
