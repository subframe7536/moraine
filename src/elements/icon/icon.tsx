import type { Component, JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace IconT {
  export type Name = string | JSX.Element | Component<Omit<IconProps, 'name'>>
  export type Slot = 'icon'
  export type Variant = {}
  export interface Items {}
  export type Extend = never

  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends IconT.Props {}

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const [localProps, restProps] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])

  const style = createMemo(() => {
    if (!localProps.size) {
      return localProps.style
    }
    return {
      'font-size': typeof localProps.size === 'number' ? `${localProps.size}px` : localProps.size,
      ...(localProps.style as any),
    } as JSX.CSSProperties
  })

  return (
    <Dynamic
      component={
        typeof localProps.name === 'string'
          ? 'div'
          : typeof localProps.name === 'function'
            ? localProps.name
            : () => localProps.name as JSX.Element
      }
      data-slot={localProps.slotName ?? 'icon'}
      class={cn(typeof localProps.name === 'string' && localProps.name, localProps.class)}
      style={style()}
      {...restProps}
      aria-hidden={restProps['aria-label'] ? undefined : true}
    />
  )
}
