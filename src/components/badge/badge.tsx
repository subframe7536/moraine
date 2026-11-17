import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { hasContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { Icon } from '../icon'

import { badgeRecipe } from './badge.recipe'
import type { BadgeProps } from './badge.types'

/**
 * Compact label for status or metadata beside related content, with optional leading and trailing
 * icons. It renders a presentational `span` by default and does not replace an accessible status
 * announcement. For a clickable badge, set `as` to a semantic element such as `"button"` and give
 * it an accessible name.
 *
 * @example
 * ```tsx
 * import { Badge } from 'moraine'
 *
 * <Badge variant="soft" leading="i-lucide:circle-check">
 *   In progress
 * </Badge>
 * ```
 */
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
    'label',
    'children',
  ])
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.label ?? local.children)
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
