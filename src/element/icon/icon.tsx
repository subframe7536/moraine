import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { iconRecipe } from './icon.recipe'
import type { IconProps } from './icon.types'

/** Renders an icon from a UnoCSS icon class, JSX element, or Solid component. */
export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'name',
    'class',
    'style',
    'classes',
    'styles',
    'size',
    'slotName',
    'aria-hidden',
    'role',
  ])
  const name = createMemo(() => local.name)
  const resolved = createStyles(iconRecipe, local, {
    own: () => ({
      root: {
        class: typeof name() === 'string' ? name() : undefined,
        style: {
          'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
        },
      },
    }),
  })

  const accessibilityProps = () => {
    const labelled = Boolean(rest['aria-label'] || rest['aria-labelledby'])

    return {
      'aria-hidden': local['aria-hidden'] ?? (labelled ? undefined : true),
      role: local.role ?? (labelled ? 'img' : undefined),
    }
  }

  const componentProps = createMemo<{ children?: JSX.Element; component: ValidComponent }>(() => {
    const value = name()

    if (typeof value === 'string') {
      return { component: 'div' }
    }

    if (typeof value === 'function') {
      return { component: value }
    }

    return {
      children: value,
      component: 'div',
    }
  })

  return (
    <Dynamic
      component={componentProps().component}
      data-slot={local.slotName ?? 'icon'}
      {...rest}
      {...accessibilityProps()}
      {...resolved.slots.root}
    >
      {componentProps().children}
    </Dynamic>
  )
}
