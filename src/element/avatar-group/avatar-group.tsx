import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Avatar } from '../avatar/avatar'

import { avatarGroupRecipe } from './avatar-group.recipe'
import type { AvatarGroupProps } from './avatar-group.types'

/** Group of overlapping avatars with optional overflow count. */
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
  const { slots, variants, overrides } = useRecipe(avatarGroupRecipe, local)

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
      <div data-slot="avatar-group" {...rest} {...slots.root}>
        <For each={visibleItems()}>
          {(item) => (
            <Avatar
              {...item}
              size={size()}
              slotName="avatar-group-item"
              {...slots.item}
              {...overrides(['image', 'fallback', 'fallbackContent', 'badge'])}
            />
          )}
        </For>
        <Show when={hiddenCount() > 0}>
          <span data-slot="avatar-group-count" {...slots.count}>
            +{hiddenCount()}
          </span>
        </Show>
      </div>
    </Show>
  )
}
