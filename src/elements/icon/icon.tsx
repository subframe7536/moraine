import type { Component, JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '../../shared/utils'

import { iconSizeVariants } from './icon.class'

export type IconName = string | JSX.Element | Component<Omit<IconProps, 'name'>>

export interface IconBaseProps {
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
   * Slot name
   * @default 'icon'
   */
  'data-slot'?: string
  style?: JSX.CSSProperties
}

export type IconProps = IconBaseProps &
  Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    keyof IconBaseProps | 'aria-hidden' | 'children' | 'style'
  >

export function Icon(props: IconProps): JSX.Element {
  const [localProps, restProps] = splitProps(props, ['name', 'class', 'style', 'size', 'data-slot'])

  const sizeVariant = createMemo(() => {
    const s = localProps.size
    if (s === 'xs' || s === 'sm' || s === 'md' || s === 'lg' || s === 'xl') {
      return s
    }
    return undefined
  })

  const style = createMemo(() => {
    if (!localProps.size || sizeVariant()) {
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
          ? 'span'
          : typeof localProps.name === 'function'
            ? localProps.name
            : () => localProps.name as JSX.Element
      }
      data-slot={localProps['data-slot'] ?? 'icon'}
      class={cn(
        iconSizeVariants({ size: sizeVariant() }),
        typeof localProps.name === 'string' && localProps.name,
        localProps.class,
      )}
      style={style()}
      {...restProps}
      aria-hidden={restProps['aria-label'] ? undefined : true}
    />
  )
}
