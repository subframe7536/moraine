import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { Show, children as resolveChildren, createMemo, merge, omit } from 'solid-js'

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
  const rest = omit(
    props,
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
  )
  const leading = createMemo(() => props.leading)
  const trailing = createMemo(() => props.trailing)
  const resolvedChildren = resolveChildren(() => props.children)
  const hasChildren = () => hasContent(resolvedChildren())
  const square = () => !hasChildren() && Boolean(leading()) !== Boolean(trailing())
  const styleProps = merge(props, {
    get square() {
      return square()
    },
  })
  const {
    slots: { root: rootSlot, leading: leadingSlot, label: labelSlot, trailing: trailingSlot },
  } = useRecipe(badgeRecipe, styleProps)

  const Root = dynamic<ValidComponent>(() => props.as ?? 'span')

  return (
    <Root data-slot="badge" {...rootSlot} {...(rest as Record<string, unknown>)}>
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
    </Root>
  )
}
