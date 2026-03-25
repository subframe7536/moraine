import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import type { IconT } from '../icon'
import { Icon } from '../icon'

import type { AvatarVariantProps } from './avatar.class'
import {
  avatarBadgeVariants,
  avatarFallbackIconVariants,
  avatarFallbackVariants,
  avatarGroupCountVariants,
  avatarGroupItemVariants,
  avatarImageVariants,
  avatarRootVariants,
} from './avatar.class'

type Status = 'idle' | 'loading' | 'loaded' | 'error'

export namespace AvatarT {
  export type Slot =
    | 'root'
    | 'image'
    | 'fallback'
    | 'fallbackIcon'
    | 'badge'
    | 'group'
    | 'groupItem'
    | 'groupCount'
  export type Variant = AvatarVariantProps
  export interface Items {
    /**
     * Source URL for the avatar image.
     */
    src?: string

    /**
     * Accessible alt text for the avatar.
     */
    alt?: string

    /**
     * Icon name for the badge.
     */
    icon?: IconT.Name

    /**
     * Position of the badge.
     * @default 'bottom-right'
     */
    badgePosition?: NonNullable<AvatarVariantProps['badgePosition']>

    /**
     * Initial text to show if image fails or is missing.
     */
    text?: string

    /**
     * Icon name to show as fallback.
     */
    fallback?: IconT.Name

    /**
     * Callback when the loading status of the avatar changes.
     */
    onStatusChange?: (status: Status) => void
  }
  export interface Extend {}
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Avatar component.
   */
  export interface Base {
    /**
     * Array of items to render in a group.
     */
    items?: Items[]

    /**
     * Maximum number of avatars to show when in a group.
     */
    max?: number | string
  }

  /**
   * Props for the Avatar component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Avatar component.
 */
export interface AvatarProps extends AvatarT.Props {}

function resolveMax(max: AvatarProps['max']): number | undefined {
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

function resolveFallbackText(text: string | undefined, alt: string | undefined): string {
  const preferredText = text?.trim()
  if (preferredText) {
    return preferredText
  }

  const initials = (alt ?? '')
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || '\u00A0'
}

/** Circular user or entity avatar with fallback initials and optional indicator. */
export function Avatar(props: AvatarProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      transition: 'normal' as const,
      items: [] as AvatarT.Items[],
      max: undefined as number | string | undefined,
    },
    props,
  )

  const visibleItems = createMemo(() => {
    const allItems = merged.items
    if (allItems.length === 0) {
      return []
    }

    const max = resolveMax(merged.max)
    if (!max) {
      return [...allItems].reverse()
    }

    return [...allItems].slice(0, max).reverse()
  })

  const hiddenCount = createMemo(() => {
    return merged.items.length - visibleItems().length
  })

  function AvatarFace(props: AvatarT.Items & { slot: 'root' | 'groupItem' }): JSX.Element {
    const [status, setStatusSignal] = createSignal<Status>('idle')
    const [resolvedSrc, setResolvedSrc] = createSignal<string | undefined>(undefined)

    let currentStatus: Status = 'idle'

    function setStatus(nextStatus: Status): void {
      if (currentStatus === nextStatus) {
        return
      }

      currentStatus = nextStatus
      setStatusSignal(nextStatus)
      props.onStatusChange?.(nextStatus)
    }

    createEffect(() => {
      const source = props.src?.trim() || undefined
      let cancelled = false

      onCleanup(() => {
        cancelled = true
      })

      setResolvedSrc(undefined)

      if (!source || typeof window === 'undefined' || typeof window.Image !== 'function') {
        setStatus('error')
        return
      }

      setStatus('loading')
      const loader = new window.Image()

      loader.onload = () => {
        if (cancelled) {
          return
        }
        setResolvedSrc(source)
        setStatus('loaded')
      }

      loader.onerror = () => {
        if (cancelled) {
          return
        }
        setResolvedSrc(undefined)
        setStatus('error')
      }

      loader.src = source
    })

    return (
      <span
        data-slot={props.slot}
        data-status={status()}
        style={props.slot === 'groupItem' ? merged.styles?.groupItem : merged.styles?.root}
        class={avatarRootVariants(
          {
            size: merged.size,
          },
          props.slot === 'groupItem'
            ? avatarGroupItemVariants(
                {
                  size: merged.size,
                },
                merged.classes?.root,
                merged.classes?.groupItem,
              )
            : merged.classes?.root,
        )}
      >
        <img
          data-slot="image"
          style={merged.styles?.image}
          src={resolvedSrc()}
          alt={props.alt ?? ''}
          class={avatarImageVariants(
            {
              status: status(),
              transition: merged.transition,
            },
            merged.classes?.image,
          )}
        />

        <span
          data-slot="fallback"
          style={merged.styles?.fallback}
          class={avatarFallbackVariants(
            {
              size: merged.size,
              status: status(),
              transition: merged.transition,
            },
            merged.classes?.fallback,
          )}
        >
          <Show when={props.fallback} fallback={resolveFallbackText(props.text, props.alt)}>
            {(fallbackIcon) => (
              <Icon
                name={fallbackIcon()}
                slotName="fallbackIcon"
                style={merged.styles?.fallbackIcon}
                class={avatarFallbackIconVariants(
                  {
                    size: merged.size,
                  },
                  merged.classes?.fallbackIcon,
                )}
              />
            )}
          </Show>
        </span>

        <Show when={props.icon}>
          {(badge) => (
            <span
              data-slot="badge"
              style={merged.styles?.badge}
              class={avatarBadgeVariants(
                {
                  size: merged.size,
                  badgePosition: props.badgePosition ?? 'bottom-right',
                },
                merged.classes?.badge,
              )}
            >
              <Icon name={badge()} class="text-[0.75em]" />
            </span>
          )}
        </Show>
      </span>
    )
  }

  return (
    <Show
      when={merged.items.length > 1}
      fallback={
        <Show when={merged.items.length === 1}>
          <AvatarFace {...merged.items[0]!} slot="root" />
        </Show>
      }
    >
      <div
        data-slot="group"
        style={merged.styles?.group}
        class={cn('inline-flex flex-row-reverse justify-end', merged.classes?.group)}
      >
        <Show when={hiddenCount() > 0}>
          <span
            data-slot="groupCount"
            style={merged.styles?.groupCount}
            class={avatarGroupCountVariants(
              {
                size: merged.size,
              },
              merged.classes?.groupCount,
            )}
          >
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>{(item) => <AvatarFace {...item} slot="groupItem" />}</For>
      </div>
    </Show>
  )
}
