import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { hasContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { Icon } from '../icon'

import { badgeRecipe } from './badge.recipe'
import type { BadgeProps } from './badge.types'

/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge<T extends ValidComponent = 'span'>(props: BadgeProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'size',
    'variant',
    'tone',
    'classes',
    'styles',
    'class',
    'style',
    'leading',
    'trailing',
    'children',
  ])
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.children)
  const hasChildren = () => hasContent(resolvedChildren())
  const square = () => !hasChildren() && Boolean(leading()) !== Boolean(trailing())
  const styleProps = mergeProps(local, {
    get square() {
      return square()
    },
  })
  const {
    slots: { root: rootSlot, leading: leadingSlot, label: labelSlot, trailing: trailingSlot },
  } = useRecipe(badgeRecipe, styleProps)

  return (
    <Dynamic component={local.as ?? 'span'} data-slot="badge" {...rootSlot} {...rest}>
      <Show when={leading()}>
        {(leading) => <Icon name={leading()} data-slot="badge-leading" {...leadingSlot} />}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="badge-label" {...labelSlot}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        <Icon name={trailing()} data-slot="badge-trailing" {...trailingSlot} />
      </Show>
    </Dynamic>
  )
}
