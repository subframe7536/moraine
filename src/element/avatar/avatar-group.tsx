import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { AvatarFace } from './avatar'
import { avatarGroupRecipe } from './avatar-group.recipe.ts'
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
  const resolved = createStyles(avatarGroupRecipe, local)

  const size = () => resolved.variants.size
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
      <div data-slot="avatar-group" {...rest} {...resolved.styles.root}>
        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={size()}
              rootSlot="avatar-group-item"
              {...resolved.styles.item}
              classes={{
                image: resolved.styles.image.class,
                fallback: resolved.styles.fallback.class,
                fallbackContent: resolved.styles.fallbackContent.class,
                badge: resolved.styles.badge.class,
              }}
              styles={{
                image: resolved.styles.image.style,
                fallback: resolved.styles.fallback.style,
                fallbackContent: resolved.styles.fallbackContent.style,
                badge: resolved.styles.badge.style,
              }}
            />
          )}
        </For>
        <Show when={hiddenCount() > 0}>
          <span data-slot="avatar-group-count" {...resolved.styles.count}>
            +{hiddenCount()}
          </span>
        </Show>
      </div>
    </Show>
  )
}
