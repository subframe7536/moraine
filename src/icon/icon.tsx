import type { Component, JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '../shared/utils'

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
  loading?: boolean
  style?: JSX.CSSProperties
}

export type IconProps = IconBaseProps &
  Omit<JSX.HTMLAttributes<HTMLSpanElement>, keyof IconBaseProps | 'aria-hidden' | 'children'>

export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'data-slot'])
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
          ? 'span'
          : typeof local.name === 'function'
            ? local.name
            : () => local.name as JSX.Element
      }
      data-slot={local['data-slot'] ?? 'icon'}
      class={cn('inline-flex shrink-0', typeof local.name === 'string' && local.name, local.class)}
      style={style()}
      size={local.size}
      {...rest}
      aria-hidden={rest['aria-label'] ? undefined : true}
    />
  )
}
