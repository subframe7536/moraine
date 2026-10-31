import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { iconRecipe } from './icon.recipe'
import type { IconProps } from './icon.types'

/** Renders an icon from a UnoCSS icon class, JSX element, or Solid component inside a `span` host. */
export function Icon(props: IconProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'name',
    'class',
    'style',
    'classes',
    'styles',
    'aria-hidden',
    'role',
  ])
  const name = createMemo(() => local.name)
  const isString = createMemo(() => typeof name() === 'string')

  const {
    slots: { root: rootSlot },
  } = useRecipe(iconRecipe, local, {
    context: () => ({ variants: { isMask: isString() } }),
    own: { root: () => ({ class: isString() ? (name() as string) : undefined }) },
  })

  const accessibilityProps = () => {
    const labelled = Boolean(rest['aria-label'] || rest['aria-labelledby'])

    return {
      'aria-hidden': local['aria-hidden'] ?? (labelled ? undefined : true),
      role: local.role ?? (labelled ? 'img' : undefined),
    }
  }

  // The host owns every attribute and slot binding. A component graphic is rendered without
  // props, so slot styling never depends on whether it forwards them.
  return (
    <span {...rootSlot} {...rest} {...accessibilityProps()}>
      <Show when={!isString()}>
        <Show when={typeof name() === 'function'} fallback={name() as JSX.Element}>
          <Dynamic component={name() as ValidComponent} />
        </Show>
      </Show>
    </span>
  )
}
