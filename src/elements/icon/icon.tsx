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
  const [local, rest] = splitProps(props, [
    'name',
    'class',
    'style',
    'size',
    'slotName',
    'aria-hidden',
    'role',
  ])
  const resolved = createStyles(iconRecipe, local)

  const name = createMemo(() => local.name)
  const accessibilityProps = createMemo(() => {
    const labelled = Boolean(rest['aria-label'] || rest['aria-labelledby'])

    return {
      'aria-hidden': local['aria-hidden'] ?? (labelled ? undefined : true),
      role: local.role ?? (labelled ? 'img' : undefined),
    }
  })

  const componentProps = createMemo<{ children?: JSX.Element; component: ValidComponent }>(() => {
    const value = name()

    if (typeof value === 'string') {
      return { component: 'div' }
    }

    if (typeof value === 'function') {
      return {
        // Dynamic invokes components untracked; render zero-argument functions through JSX.
        component:
          value.length > 0 ? value : (props: Omit<IconProps, 'name'>) => <>{value(props)}</>,
      }
    }

    return {
      children: value,
      component: 'div',
    }
  })

  return (
    <Dynamic
      data-slot={local.slotName ?? 'icon'}
      {...rest}
      {...accessibilityProps()}
      {...componentProps()}
      style={{
        'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
        ...resolved.styles.root.style,
      }}
      class={cn(typeof name() === 'string' && (name() as string), resolved.styles.root.class)}
    />
  )
}
