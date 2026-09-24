import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { Icon } from '../icon'

import { badgeRecipe } from './badge.recipe'
import type { BadgeProps } from './badge.types'

/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge<T extends ValidComponent = 'span'>(props: BadgeProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'size',
    'variant',
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
  const hasChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })
  const square = () => !hasChildren() && Boolean(leading()) !== Boolean(trailing())
  const styleProps = mergeProps(local, {
    get square() {
      return square()
    },
  })
  const resolved = createStyles(badgeRecipe, styleProps)

  return (
    <Dynamic component={local.as ?? 'span'} data-slot="badge" {...rest} {...resolved.styles.root}>
      <Show when={leading()}>
        {(leading) => (
          <Icon name={leading()} slotName="badge-leading" {...resolved.styles.leading} />
        )}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="badge-label" {...resolved.styles.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        <Icon name={trailing()} slotName="badge-trailing" {...resolved.styles.trailing} />
      </Show>
    </Dynamic>
  )
}
