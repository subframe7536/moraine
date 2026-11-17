import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Avatar } from '../avatar/avatar'

import { avatarGroupRecipe } from './avatar-group.recipe'
import type { AvatarGroupProps } from './avatar-group.types'

/**
 * Group of overlapping avatars with optional overflow count, for showing a small set of people in
 * a bounded space. Each entry in `items` takes the `Avatar` props. Use `Avatar` for a single
 * person. It renders nothing for an empty `items` array, and `max` caps the visible avatars,
 * replacing the rest with a `+N` count.
 *
 * @example
 * ```tsx
 * import { AvatarGroup } from 'moraine'
 *
 * <AvatarGroup
 *   max={3}
 *   items={[
 *     { src: '/alex.png', alt: 'Alex', text: 'A' },
 *     { alt: 'Blake', text: 'B' },
 *     { alt: 'Casey', text: 'C' },
 *     { alt: 'Drew', text: 'D' },
 *   ]}
 * />
 * ```
 */
export function AvatarGroup(props: AvatarGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'max',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const {
    slots: { root: rootSlot, item: itemSlot, count: countSlot },
    variants,
    overrides,
  } = useRecipe(avatarGroupRecipe, local)

  const size = () => variants.size
  const items = createMemo(() => local.items ?? [])
  const visibleItems = createMemo(() => {
    const allItems = items()
    if (allItems.length === 0) {
      return []
    }

    const max = local.max
    return max === undefined ? allItems : allItems.slice(0, Math.max(0, Math.floor(max)))
  })

  const hiddenCount = createMemo(() => items().length - visibleItems().length)

  return (
    <Show when={items().length > 0}>
      <div data-slot="avatar-group" {...rootSlot} {...rest}>
        <For each={visibleItems()}>
          {(item) => (
            <Avatar
              {...item}
              size={size()}
              slotName="avatar-group-item"
              {...itemSlot}
              {...overrides({
                image: 'image',
                fallback: 'fallback',
                fallbackContent: 'fallbackContent',
                badge: 'badge',
              })}
            />
          )}
        </For>
        <Show when={hiddenCount() > 0}>
          <span data-slot="avatar-group-count" {...countSlot}>
            +{hiddenCount()}
          </span>
        </Show>
      </div>
    </Show>
  )
}
