import type { Component, JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '../../shared/utils'

export type IconName = string | JSX.Element | Component<Omit<IconProps, 'name'>>

/**
 * Base props for the Icon component.
 */
export interface IconBaseProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'aria-hidden' | 'children' | 'style' | 'size' | 'class' | 'id'
> {
  /**
   * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
   * or app-config aliases such as `icon-search`.
   * Non-string values can be JSX nodes or render functions.
   */
  name: IconName

  /**
   * Icon size. Numbers are interpreted as px.
   */
  size?: string | number

  /**
   * Data slot for styling.
   * @default 'icon'
   */
  'data-slot'?: string

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
export type IconProps = IconBaseProps

export function Icon(props: IconProps): JSX.Element {
  const [localProps, restProps] = splitProps(props, ['name', 'class', 'style', 'size', 'data-slot'])

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
          ? 'i'
          : typeof localProps.name === 'function'
            ? localProps.name
            : () => localProps.name as JSX.Element
      }
      data-slot={localProps['data-slot'] ?? 'icon'}
      class={cn(typeof localProps.name === 'string' && localProps.name, localProps.class)}
      style={style()}
      {...restProps}
      aria-hidden={restProps['aria-label'] ? undefined : true}
    />
  )
}
