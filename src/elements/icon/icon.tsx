import type { Component, JSX, ValidComponent } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps } from '../../shared/types.ts'

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
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends IconT.Props {}

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const config = useMoraineConfig()
  const provider = () => config().icon

  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])
  const name = createMemo(() => local.name)

  const resolved = resolveComponentStyle({
    base: {
      get classes() {
        const value = name()
        return { root: typeof value === 'string' ? value : undefined }
      },
      get styles() {
        return {
          root: {
            'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
          },
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

  const componentProps = createMemo<{ component: ValidComponent }>(() => {
    const value = name()

    if (typeof value === 'string') {
      return { component: 'div' }
    }

    return {
      component: typeof value === 'function' ? value : () => value,
    }
  })

  return (
    <Dynamic
      data-slot={local.slotName ?? 'icon'}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
      {...componentProps()}
      {...resolved.rootClassAndStyle()}
    />
  )
}
