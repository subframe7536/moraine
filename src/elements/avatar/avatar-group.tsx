import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import type { AvatarGroupProps } from './avatar-group.types.ts'
import { AvatarFace } from './avatar.tsx'

export * from './avatar-group.types.ts'

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
  const design = useMoraineDesign()
  const avatarGroupDesign = () => design().avatarGroup

  const [local, rest] = splitProps(props, [
    'items',
    'max',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const size = () => local.size ?? avatarGroupDesign()?.defaultVariants?.size ?? 'md'
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

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return avatarGroupDesign()?.recipe({ size: size() })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  return (
    <Show when={items().length > 0}>
      <div data-slot="root" {...rest} {...resolved.rootClassAndStyle()}>
        <Show when={hiddenCount() > 0}>
          <span data-slot="count" {...resolved.slotClassAndStyle('count')}>
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={size()}
              rootSlot="item"
              {...resolved.slotClassAndStyle('item')}
              classes={{
                image: resolved.slotClass('image'),
                fallback: resolved.slotClass('fallback'),
                fallbackIcon: resolved.slotClass('fallbackIcon'),
                badge: resolved.slotClass('badge'),
              }}
              styles={{
                image: resolved.slotStyle('image'),
                fallback: resolved.slotStyle('fallback'),
                fallbackIcon: resolved.slotStyle('fallbackIcon'),
                badge: resolved.slotStyle('badge'),
              }}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
