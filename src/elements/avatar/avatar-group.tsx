import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import type { AvatarGroupVariantProps } from './avatar.class.ts'
import { avatarGroupCountVariants, avatarGroupItemVariants } from './avatar.class.ts'
import { AvatarFace } from './avatar.tsx'
import type { AvatarT } from './avatar.tsx'

export namespace AvatarGroupT {
  export interface Slot<T = unknown> {
    /** Container of grouped avatars. */
    root?: T

    /** Individual avatar wrapper used when rendering grouped avatars. */
    item?: T

    /** Count indicator shown when a group has more avatars than the visible limit. */
    count?: T

    /** Loaded avatar image rendered inside each frame. */
    image?: T

    /** Text fallback shown while an image is unavailable or failed. */
    fallback?: T

    /** Icon fallback shown when no image or text fallback is available. */
    fallbackIcon?: T

    /** Status or indicator badge anchored to an avatar frame. */
    badge?: T
  }
  export type Variant = AvatarGroupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = AvatarT.Base

  /** Base props for the AvatarGroup component. */
  export interface Base {
    /**
     * Array of avatars to render in the group.
     * @default []
     */
    items?: Item[]

    /** Maximum number of avatars to show. */
    max?: number | string
  }

  /** Props for the AvatarGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the AvatarGroup component. */
export interface AvatarGroupProps extends AvatarGroupT.Props {}

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
  const merged = mergeProps(
    {
      size: 'md' as const,
      items: [] as AvatarGroupT.Item[],
      max: undefined as number | string | undefined,
    },
    local,
  )

  const items = createMemo(() => merged.items)
  const visibleItems = createMemo(() => {
    const allItems = items()
    if (allItems.length === 0) {
      return []
    }

    const max = resolveMax(merged.max)
    if (!max) {
      return [...allItems].reverse()
    }

    return [...allItems].slice(0, max).reverse()
  })

  const hiddenCount = createMemo(() => items().length - visibleItems().length)

  return (
    <Show when={items().length > 0}>
      <div
        data-slot="root"
        {...rest}
        style={{ ...merged.styles?.root, ...merged.style }}
        class={cn('inline-flex flex-row-reverse justify-end', merged.classes?.root, merged.class)}
      >
        <Show when={hiddenCount() > 0}>
          <span
            data-slot="count"
            style={merged.styles?.count}
            class={avatarGroupCountVariants({ size: merged.size }, merged.classes?.count)}
          >
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={merged.size}
              rootSlot="item"
              style={merged.styles?.item}
              class={avatarGroupItemVariants({ size: merged.size }, merged.classes?.item)}
              classes={merged.classes}
              styles={merged.styles}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
