import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { cn, combineStyle } from '../shared/utils'

import type { IconVariantProps } from './icon.class'
import { iconVariants } from './icon.class'

export type IconName = string | JSX.Element | (() => JSX.Element)

export interface IconClasses {
  root?: string
}

export interface IconBaseProps extends IconVariantProps {
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
   * Optional icon name customizer for string-based icons.
   */
  customize?: (content: string, name?: string, prefix?: string, provider?: string) => string

  /**
   * Slot-based class overrides.
   */
  classes?: IconClasses
}

export type IconProps = IconBaseProps &
  Omit<JSX.HTMLAttributes<HTMLSpanElement>, keyof IconBaseProps | 'children' | 'class'>

function parseIconName(value: string): { name: string; prefix?: string } {
  const cleaned = value.startsWith('i-') ? value.slice(2) : value
  const [prefix] = cleaned.split('-')

  return {
    name: cleaned,
    prefix,
  }
}

export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props as IconProps, [
    'style',
    'name',
    'mode',
    'size',
    'customize',
    'classes',
    'aria-label',
  ])

  const sizeStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    if (local.size === undefined || local.size === null) {
      return undefined
    }

    if (typeof local.size === 'number') {
      return {
        'font-size': `${local.size}px`,
      }
    }

    return {
      'font-size': local.size,
    }
  })

  const iconClass = createMemo(() => {
    if (typeof local.name !== 'string') {
      return undefined
    }

    const parsed = parseIconName(local.name)
    const customized = local.customize?.(parsed.name, parsed.name, parsed.prefix, undefined)

    return customized ?? local.name
  })

  const renderedContent = createMemo<JSX.Element>(() => {
    if (typeof local.name === 'function') {
      return local.name()
    }

    if (typeof local.name === 'string') {
      return ''
    }

    return local.name
  })

  return (
    <span
      data-slot="icon"
      class={cn(
        iconVariants({
          mode: local.mode,
        }),
        iconClass(),
        local.classes?.root,
      )}
      style={combineStyle(local.style, sizeStyle())}
      aria-hidden={local['aria-label'] ? undefined : 'true'}
      {...rest}
    >
      <Show when={typeof local.name !== 'string'}>{renderedContent()}</Show>
    </span>
  )
}
