import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import type { ValidComponent } from '../../shared/types.ts'

import { iconRecipe } from './icon.recipe'
import type { IconProps } from './icon.types'

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, ['name', 'class', 'style', 'size', 'slotName'])
  const resolved = createStyles(iconRecipe, local)

  const name = createMemo(() => local.name)

  const componentProps = createMemo<{ component: ValidComponent }>(() => {
    const value = name()

    if (typeof value === 'string') {
      return { component: 'div' }
    }

    if (typeof value === 'function') {
      return {
        // Dynamic invokes components untracked; JSX accessors must stay reactive.
        component:
          value.length > 0 ? value : (props: Omit<IconProps, 'name'>) => <>{value(props)}</>,
      }
    }

    return {
      component: () => value,
    }
  })

  return (
    <Dynamic
      data-slot={local.slotName ?? 'icon'}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
      {...componentProps()}
      style={{
        'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
        ...resolved.styles.root.style,
      }}
      class={cn(typeof name() === 'string' && (name() as string), resolved.styles.root.class)}
    />
  )
}
