import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
import type { IconT } from '../icon/index'
import { Icon } from '../icon/index'

import type { AvatarVariantProps } from './avatar.class'
import {
  AVATAR_IMAGE_CLASS,
  avatarBadgeVariants,
  avatarFallbackIconVariants,
  avatarFallbackVariants,
  avatarRootVariants,
} from './avatar.class'

export namespace AvatarT {
  export type Status = 'idle' | 'loading' | 'loaded' | 'error'

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

  export interface Item {}

  /** Base props for the Avatar component. */
  export interface Base {
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
    onStatusChange?: (status: AvatarT.Status) => void
  }

  /** Props for the Avatar component. */
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/** Props for the Avatar component. */
export interface AvatarProps extends AvatarT.Props {}

export function resolveFallbackText(text: string | undefined, alt: string | undefined): string {
  const preferredText = text?.trim()
  if (preferredText) {
    return preferredText
  }

  const initials = (alt ?? '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toUpperCase()
  const resolvedInitials = Array.from(initials).slice(0, 2).join('')

  return resolvedInitials || '\u00A0'
}

interface AvatarFaceProps extends AvatarT.Base {
  class?: SlotClassValue
  style?: JSX.CSSProperties
  classes?: AvatarT.Classes
  styles?: AvatarT.Styles
  size?: AvatarT.Variant['size']
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
    'rootSlot',
  ])
  const merged = mergeProps(
    {
      size: 'md' as const,
    },
    local,
  )
  const source = createMemo(() => merged.src?.trim() || undefined)
  const alt = createMemo(() => merged.alt)
  const text = createMemo(() => merged.text)
  const fallback = createMemo(() => merged.fallback)
  const badge = createMemo(() => merged.badge)
  const fallbackText = createMemo(() => resolveFallbackText(text(), alt()))
  const fallbackAccessibleLabel = createMemo(() => alt()?.trim() || text()?.trim() || undefined)
  const rootAriaLabel = createMemo(() => (rest as JSX.AriaAttributes)['aria-label'])
  const [status, setStatusSignal] = createSignal<AvatarT.Status>('idle')
  const [resolvedSrc, setResolvedSrc] = createSignal<string | undefined>(undefined)

  let currentStatus: AvatarT.Status = 'idle'

  function setStatus(nextStatus: AvatarT.Status): void {
    if (currentStatus === nextStatus) {
      return
    }

    currentStatus = nextStatus
    setStatusSignal(nextStatus)
    untrack(() => merged.onStatusChange)?.(nextStatus)
  }

  createEffect(() => {
    const currentSource = source()
    let cancelled = false

    onCleanup(() => {
      cancelled = true
    })

    setResolvedSrc(undefined)

    if (!currentSource || typeof window === 'undefined' || typeof window.Image !== 'function') {
      setStatus('error')
      return
    }

    setStatus('loading')
    const loader = new window.Image()

    loader.onload = () => {
      if (cancelled) {
        return
      }
      setResolvedSrc(currentSource)
      setStatus('loaded')
    }

    loader.onerror = () => {
      if (cancelled) {
        return
      }
      setResolvedSrc(undefined)
      setStatus('error')
    }

    loader.src = currentSource

    if (loader.complete) {
      if (loader.naturalWidth > 0) {
        setResolvedSrc(currentSource)
        setStatus('loaded')
      } else {
        setStatus('error')
      }
    }
  })

  return (
    <span
      data-slot={merged.rootSlot ?? 'root'}
      data-status={status()}
      role={rootAriaLabel() !== undefined ? 'img' : undefined}
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
        alt={alt() ?? ''}
        aria-hidden={rootAriaLabel() !== undefined || status() !== 'loaded' ? 'true' : undefined}
        class={cn(
          AVATAR_IMAGE_CLASS,
          status() === 'loaded' ? 'opacity-100' : 'hidden-hitless',
          merged.classes?.image,
        )}
      />

      <span
        data-slot="fallback"
        role={
          status() !== 'loaded' && rootAriaLabel() === undefined && fallbackAccessibleLabel()
            ? 'img'
            : undefined
        }
        aria-label={
          status() !== 'loaded' && rootAriaLabel() === undefined
            ? fallbackAccessibleLabel()
            : undefined
        }
        aria-hidden={rootAriaLabel() !== undefined || status() === 'loaded' ? 'true' : undefined}
        style={merged.styles?.fallback}
        class={avatarFallbackVariants(
          {
            size: merged.size,
            status: status(),
          },
          merged.classes?.fallback,
        )}
      >
        <Show when={fallback()} fallback={fallbackText()}>
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
