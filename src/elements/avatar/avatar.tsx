import type { JSX } from 'solid-js'
import { For, Show, createEffect, createSignal, mergeProps, on, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'
import type { IconName } from '../icon'
import { Icon } from '../icon'

import type {
  AvatarBadgePosition,
  AvatarSize,
  AvatarTransition,
  AvatarVariantProps,
} from './avatar.class'
import {
  avatarBadgeVariants,
  avatarFallbackIconVariants,
  avatarFallbackVariants,
  avatarGroupCountVariants,
  avatarGroupItemVariants,
  avatarImageVariants,
  avatarRootVariants,
} from './avatar.class'

export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error'

type AvatarSlots =
  | 'root'
  | 'image'
  | 'fallback'
  | 'fallbackIcon'
  | 'badge'
  | 'group'
  | 'groupItem'
  | 'groupCount'

export type AvatarClasses = SlotClasses<AvatarSlots>

export type AvatarStyles = SlotStyles<AvatarSlots>

export interface AvatarItem {
  src?: string
  alt?: string
  badge?: IconName
  badgePosition?: AvatarBadgePosition
  text?: string
  fallback?: IconName
  onStatusChange?: (status: AvatarStatus) => void
}

export interface AvatarBaseProps
  extends Pick<AvatarVariantProps, 'size' | 'transition'>, AvatarItem {
  items?: AvatarItem[]
  max?: number | string
  classes?: AvatarClasses
  styles?: AvatarStyles
}

export type AvatarProps = AvatarBaseProps

interface AvatarFaceInput {
  src: () => string | undefined
  alt: () => string | undefined
  badge: () => IconName | undefined
  badgePosition: () => AvatarBadgePosition | undefined
  text: () => string | undefined
  fallback: () => IconName | undefined
  onStatusChange: () => ((status: AvatarStatus) => void) | undefined
}

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

export function Avatar(props: AvatarProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      transition: 'normal' as const,
      items: undefined as AvatarItem[] | undefined,
      max: undefined as number | string | undefined,
      badgePosition: 'bottom-right' as const,
    },
    props,
  )

  const [itemProps, styleProps] = splitProps(merged as AvatarProps, [
    'src',
    'alt',
    'badge',
    'badgePosition',
    'text',
    'fallback',
    'onStatusChange',
    'items',
    'max',
  ])

  function visibleItems(): AvatarItem[] {
    const allItems = itemProps.items ?? []
    if (allItems.length === 0) {
      return []
    }

    const max = resolveMax(itemProps.max)
    if (!max) {
      return [...allItems].reverse()
    }

    return [...allItems].slice(0, max).reverse()
  }

  function hiddenCount(): number {
    return (itemProps.items?.length ?? 0) - visibleItems().length
  }

  function renderAvatarFace(face: AvatarFaceInput, slot: 'root' | 'groupItem'): JSX.Element {
    const [status, setStatusSignal] = createSignal<AvatarStatus>('idle')
    const [resolvedSrc, setResolvedSrc] = createSignal<string | undefined>(undefined)

    let requestId = 0
    let currentStatus: AvatarStatus = 'idle'

    function setStatus(nextStatus: AvatarStatus): void {
      if (currentStatus === nextStatus) {
        return
      }

      currentStatus = nextStatus
      setStatusSignal(nextStatus)
      face.onStatusChange()?.(nextStatus)
    }

    createEffect(() => {
      const source = face.src()?.trim() || undefined
      requestId += 1
      const currentRequestId = requestId

      setResolvedSrc(undefined)

      if (!source || typeof window === 'undefined' || typeof window.Image !== 'function') {
        setStatus('error')
        return
      }

      setStatus('loading')
      const loader = new window.Image()

      loader.onload = () => {
        if (currentRequestId !== requestId) {
          return
        }

        setResolvedSrc(source)
      }

      loader.onerror = () => {
        if (currentRequestId !== requestId) {
          return
        }

        setResolvedSrc(undefined)
        setStatus('error')
      }

      loader.src = source
    })

    createEffect(
      on(
        resolvedSrc,
        (source) => {
          if (source) {
            setStatus('loaded')
          }
        },
        {
          defer: true,
        },
      ),
    )

    const size: AvatarSize = styleProps.size ?? 'md'
    const transition: AvatarTransition = styleProps.transition ?? 'normal'
    const badgePosition: AvatarBadgePosition = face.badgePosition() ?? 'bottom-right'

    return (
      <span
        data-slot={slot}
        data-status={status()}
        style={slot === 'groupItem' ? merged.styles?.groupItem : merged.styles?.root}
        class={avatarRootVariants(
          {
            size,
          },
          slot === 'groupItem'
            ? avatarGroupItemVariants(
                {
                  size,
                },
                styleProps.classes?.root,
                styleProps.classes?.groupItem,
              )
            : styleProps.classes?.root,
        )}
      >
        <img
          data-slot="image"
          style={merged.styles?.image}
          src={resolvedSrc()}
          alt={face.alt() ?? ''}
          class={avatarImageVariants(
            {
              status: status(),
              transition,
            },
            styleProps.classes?.image,
          )}
        />

        <span
          data-slot="fallback"
          style={merged.styles?.fallback}
          class={avatarFallbackVariants(
            {
              size,
              status: status(),
              transition,
            },
            styleProps.classes?.fallback,
          )}
        >
          <Show when={face.fallback()} fallback={resolveFallbackText(face.text(), face.alt())}>
            {(fallbackIcon) => (
              <Icon
                name={fallbackIcon()}
                data-slot="fallbackIcon"
                style={merged.styles?.fallbackIcon}
                class={avatarFallbackIconVariants(
                  {
                    size,
                  },
                  styleProps.classes?.fallbackIcon,
                )}
              />
            )}
          </Show>
        </span>

        <Show when={face.badge()}>
          {(badge) => (
            <span
              data-slot="badge"
              style={merged.styles?.badge}
              class={avatarBadgeVariants(
                {
                  size,
                  badgePosition,
                },
                styleProps.classes?.badge,
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
      when={(itemProps.items?.length ?? 0) > 0}
      fallback={renderAvatarFace(
        {
          src: () => itemProps.src,
          alt: () => itemProps.alt,
          badge: () => itemProps.badge,
          badgePosition: () => itemProps.badgePosition,
          text: () => itemProps.text,
          fallback: () => itemProps.fallback,
          onStatusChange: () => itemProps.onStatusChange,
        },
        'root',
      )}
    >
      <div
        data-slot="group"
        style={merged.styles?.group}
        class={cn('inline-flex flex-row-reverse justify-end', styleProps.classes?.group)}
      >
        <Show when={hiddenCount() > 0}>
          <span
            data-slot="groupCount"
            style={merged.styles?.groupCount}
            class={avatarGroupCountVariants(
              {
                size: styleProps.size,
              },
              styleProps.classes?.groupCount,
            )}
          >
            +{hiddenCount()}
          </span>
        </Show>

        <For each={visibleItems()}>
          {(item) =>
            renderAvatarFace(
              {
                src: () => item.src,
                alt: () => item.alt,
                badge: () => item.badge,
                badgePosition: () => item.badgePosition ?? itemProps.badgePosition,
                text: () => item.text,
                fallback: () => item.fallback,
                onStatusChange: () => item.onStatusChange,
              },
              'groupItem',
            )
          }
        </For>
      </div>
    </Show>
  )
}
