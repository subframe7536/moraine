import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { AvatarFace } from './avatar'
import type { AvatarGroupProps } from './avatar-group.types'
import { avatarGroupRecipe } from './avatar.recipe'

function resolveMax(max: AvatarGroupProps['max']): number | undefined {
  if (typeof max === 'string') {
    const parsed = Number.parseInt(max, 10)

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }

    return undefined
  }

  if (typeof max === 'number' && Number.isFinite(max) && max > 0) {
    return max
  }

  return undefined
}

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

    const max = resolveMax(local.max)
    if (!max) {
      return [...allItems].reverse()
    }

    return [...allItems].slice(0, max).reverse()
  })

  const hiddenCount = createMemo(() => items().length - visibleItems().length)

  return (
    <Show when={items().length > 0}>
      <div data-slot="root" {...rest} {...resolved.styles.root}>
        <Show when={hiddenCount() > 0}>
          <span data-slot="count" {...resolved.styles.count}>
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={size()}
              rootSlot="item"
              {...resolved.styles.item}
              classes={{
                image: resolved.styles.image.class,
                fallback: resolved.styles.fallback.class,
                fallbackIcon: resolved.styles.fallbackIcon.class,
                badge: resolved.styles.badge.class,
              }}
              styles={{
                image: resolved.styles.image.style,
                fallback: resolved.styles.fallback.style,
                fallbackIcon: resolved.styles.fallbackIcon.style,
                badge: resolved.styles.badge.style,
              }}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
