import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { AvatarGroupVariantProps } from './avatar.class.ts'
import { avatarGroupRecipe } from './avatar.class.ts'
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
  const config = useMoraineConfig()
  const provider = () => config().avatarGroup

  const [local, rest] = splitProps(props, [
    'items',
    'max',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const size = () =>
    (local.size ?? provider()?.variants?.size ?? 'md') as NonNullable<
      AvatarGroupVariantProps['size']
    >
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

  const slots = createMemo(() => avatarGroupRecipe({ size: size() }))

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
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
      <div data-slot="root" {...rest} style={resolved.rootStyle()} class={resolved.rootClass()}>
        <Show when={hiddenCount() > 0}>
          <span
            data-slot="count"
            style={resolved.slotStyle('count')}
            class={resolved.slotClass('count')}
          >
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) => (
            <AvatarFace
              {...item}
              size={size()}
              rootSlot="item"
              style={resolved.slotStyle('item')}
              class={resolved.slotClass('item')}
              classes={local.classes}
              styles={local.styles}
            />
          )}
        </For>
      </div>
    </Show>
  )
}
