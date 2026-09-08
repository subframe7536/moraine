import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'
import { Icon } from '../icon/index.ts'

import type { BadgeProps } from './badge.types.ts'

export * from './badge.types.ts'

/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge(props: BadgeProps): JSX.Element {
  const [local, rest] = splitProps(props, [
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
  const resolved = createComponentStyles('badge', local)

  const size = () => resolved.variants.size
  const variant = () => resolved.variants.variant

  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  return (
    <span data-slot="root" data-size={size()} data-variant={variant()} {...rest} {...resolved.root}>
      <Show when={leading()}>
        {(leading) => <Icon name={leading()} slotName="leading" {...resolved.slot('leading')} />}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="label" {...resolved.slot('label')}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        <Icon name={trailing()} slotName="trailing" {...resolved.slot('trailing')} />
      </Show>
    </span>
  )
}
