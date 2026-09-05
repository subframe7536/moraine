import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'
import type { IconT } from '../icon/index.ts'
import { Icon } from '../icon/index.ts'

import type { AvatarVariantProps } from './avatar.class.ts'
import { AVATAR_FALLBACK_HIDDEN_CLASS, avatarRecipe } from './avatar.class.ts'

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

  const config = useMoraineConfig()
  const provider = () => config().avatar

  const size = () => local.size ?? provider()?.variants?.size ?? 'md'
  const badgePosition = () =>
    local.badgePosition ?? provider()?.variants?.badgePosition ?? 'bottom-right'

  const source = createMemo(() => local.src?.trim() || undefined)
  const alt = createMemo(() => local.alt)
  const text = createMemo(() => local.text)
  const fallback = createMemo(() => local.fallback)
  const badge = createMemo(() => local.badge)
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
    untrack(() => local.onStatusChange)?.(nextStatus)
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

  const slots = createMemo(() =>
    avatarRecipe({
      size: size(),
      badgePosition: badgePosition(),
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.rootSlot === 'item' ? undefined : local.class,
        classes: local.classes,
        style: local.rootSlot === 'item' ? undefined : local.style,
        styles: local.styles,
      }
    },
    get stateCls() {
      return {
        image: status() === 'loaded' ? 'opacity-100' : 'opacity-0 pointer-events-none',
        fallback: status() === 'loaded' ? AVATAR_FALLBACK_HIDDEN_CLASS : 'opacity-100',
      }
    },
  })

  return (
    <span
      data-slot={local.rootSlot ?? 'root'}
      data-status={status()}
      role={rootAriaLabel() !== undefined ? 'img' : undefined}
      {...rest}
      {...(local.rootSlot === 'item'
        ? { class: cn(resolved.rootClass(), local.class), style: local.style }
        : resolved.rootClassAndStyle())}
    >
      <img
        data-slot="image"
        src={resolvedSrc()}
        alt={alt() ?? ''}
        aria-hidden={rootAriaLabel() !== undefined || status() !== 'loaded' ? 'true' : undefined}
        {...resolved.slotClassAndStyle('image')}
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
        {...resolved.slotClassAndStyle('fallback')}
      >
        <Show when={fallback()} fallback={fallbackText()}>
          {(fallbackIcon) => (
            <Icon
              name={fallbackIcon()}
              slotName="fallbackIcon"
              {...resolved.slotClassAndStyle('fallbackIcon')}
            />
          )}
        </Show>
      </span>

      <Show when={badge()}>
        {(badge) => (
          <span data-slot="badge" {...resolved.slotClassAndStyle('badge')}>
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
