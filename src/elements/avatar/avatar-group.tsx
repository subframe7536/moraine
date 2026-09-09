import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import type { AvatarGroupProps } from './avatar-group.types.ts'
import { AvatarFace } from './avatar.tsx'

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
  const resolved = createComponentStyles('avatarGroup', local)

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
      <div data-slot="root" {...rest} {...resolved.root}>
        <Show when={hiddenCount() > 0}>
          <span data-slot="count" {...resolved.slot('count')}>
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={size()}
              rootSlot="item"
              {...resolved.slot('item')}
              classes={{
                image: resolved.slot('image').class,
                fallback: resolved.slot('fallback').class,
                fallbackIcon: resolved.slot('fallbackIcon').class,
                badge: resolved.slot('badge').class,
              }}
              styles={{
                image: resolved.slot('image').style,
                fallback: resolved.slot('fallback').style,
                fallbackIcon: resolved.slot('fallbackIcon').style,
                badge: resolved.slot('badge').style,
              }}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
