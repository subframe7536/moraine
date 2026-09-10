import type { JSX, ValidComponent } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'

import type { IconProps } from './icon.types'

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])
  const resolved = createComponentStyles('icon', local, {
    dynamicStyles: () => ({
      root: { 'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size },
    }),
  })

  const name = createMemo(() => local.name)

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
      style={resolved.root.style}
      class={cn(typeof name() === 'string' && (name() as string), resolved.root.class)}
    />
  )
}
