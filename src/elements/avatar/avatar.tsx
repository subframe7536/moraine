import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { IconT } from '../icon/index.ts'
import { Icon } from '../icon/index.ts'

import type { AvatarVariantProps } from './avatar.class.ts'
import {
  avatarBadgeVariants,
  avatarFallbackIconVariants,
  avatarFallbackVariants,
  avatarImageVariants,
  avatarRootVariants,
} from './avatar.class.ts'

export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error'

export namespace AvatarT {
  export interface Slot<T = unknown> {
    /** Avatar frame that controls size, shape, image, fallback, and badge placement. */
    root?: T

    /** Loaded avatar image rendered inside the frame. */
    image?: T

    /** Text fallback shown while the image is unavailable or failed. */
    fallback?: T

    /** Icon fallback shown when no image or text fallback is available. */
    fallbackIcon?: T

    /** Status or indicator badge anchored to the avatar frame. */
    badge?: T
  }
  export type Variant = AvatarVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {
    /** Source URL for the avatar image. */
    src?: string

    /** Accessible alt text for the avatar. */
    alt?: string

    /** Icon name for the badge. */
    badge?: IconT.Name

    /**
     * Position of the badge.
     * @default 'bottom-right'
     */
    badgePosition?: NonNullable<AvatarVariantProps['badgePosition']>

    /** Initial text to show if image fails or is missing. */
    text?: string

    /** Icon name to show as fallback. */
    fallback?: IconT.Name

    /** Callback when the loading status of the avatar changes. */
    onStatusChange?: (status: AvatarStatus) => void
  }

  /** Base props for the Avatar component. */
  export interface Base extends Item {}

  /** Props for the Avatar component. */
  export type Props = BaseProps<'span', Base, Variant, Slot>
}

/** Props for the Avatar component. */
export interface AvatarProps extends AvatarT.Props {}

export function resolveFallbackText(text: string | undefined, alt: string | undefined): string {
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

export interface AvatarFaceProps extends AvatarT.Item {
  class?: SlotClassValue
  style?: JSX.CSSProperties
  classes?: AvatarT.Classes
  styles?: AvatarT.Styles
  size?: AvatarT.Variant['size']
  transition?: AvatarT.Variant['transition']
  rootSlot?: 'root' | 'item'
}

export function AvatarFace(props: AvatarFaceProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'src',
    'alt',
    'badge',
    'badgePosition',
    'text',
    'fallback',
    'onStatusChange',
    'class',
    'style',
    'classes',
    'styles',
    'size',
    'transition',
    'rootSlot',
  ])
  const merged = mergeProps(
    {
      size: 'md' as const,
      transition: 'normal' as const,
    },
    local,
  )
  const fallback = createMemo(() => merged.fallback)
  const badge = createMemo(() => merged.badge)
  const [status, setStatusSignal] = createSignal<AvatarStatus>('idle')
  const [resolvedSrc, setResolvedSrc] = createSignal<string | undefined>(undefined)

  let currentStatus: AvatarStatus = 'idle'

  function setStatus(nextStatus: AvatarStatus): void {
    if (currentStatus === nextStatus) {
      return
    }

    currentStatus = nextStatus
    setStatusSignal(nextStatus)
    merged.onStatusChange?.(nextStatus)
  }

  createEffect(() => {
    const source = merged.src?.trim() || undefined
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
      data-slot={merged.rootSlot ?? 'root'}
      data-status={status()}
      {...rest}
      style={
        merged.rootSlot === 'item' ? merged.style : { ...merged.styles?.root, ...merged.style }
      }
      class={avatarRootVariants(
        { size: merged.size },
        merged.rootSlot === 'item' ? merged.class : [merged.classes?.root, merged.class],
      )}
    >
      <img
        data-slot="image"
        style={merged.styles?.image}
        src={resolvedSrc()}
        alt={merged.alt ?? ''}
        class={avatarImageVariants(
          { transition: merged.transition },
          status() === 'loaded' ? 'opacity-100' : 'hidden-hitless',
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
        <Show when={fallback()} fallback={resolveFallbackText(merged.text, merged.alt)}>
          {(fallbackIcon) => (
            <Icon
              name={fallbackIcon()}
              slotName="fallbackIcon"
              style={merged.styles?.fallbackIcon}
              class={avatarFallbackIconVariants(
                { size: merged.size },
                merged.classes?.fallbackIcon,
              )}
            />
          )}
        </Show>
      </span>

      <Show when={badge()}>
        {(badge) => (
          <span
            data-slot="badge"
            style={merged.styles?.badge}
            class={avatarBadgeVariants(
              {
                size: merged.size,
                badgePosition: merged.badgePosition ?? 'bottom-right',
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

/** Circular user or entity avatar with fallback initials and optional indicator. */
export function Avatar(props: AvatarProps): JSX.Element {
  return <AvatarFace {...props} />
}
