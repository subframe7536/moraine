import type { JSX } from '@solidjs/web'
import { Show, createEffect, createMemo, createSignal, onCleanup, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'
import { Icon } from '../icon'

import { AVATAR_BADGE_ICON_CLASS, avatarDataAttributes, avatarRecipe } from './avatar.recipe'
import type { AvatarProps, AvatarT } from './avatar.types'
function resolveFallbackText(text: string | undefined, alt: string | undefined): string {
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

/**
 * Compact identity cue for a person or resource: an image with a fallback while it loads or when
 * it fails. Supply a meaningful `alt` for identity images; the fallback shows `text` (or initials
 * derived from `alt`), or an `icon` instead. Use `AvatarGroup` to stack several people. It renders
 * a `span` and uses the native image load and error events, so the `<img>` is present when
 * rendered on the server.
 *
 * @example
 * ```tsx
 * import { Avatar } from 'moraine'
 *
 * <Avatar
 *   src="/alex.png"
 *   alt="Alex Rivera"
 *   text="AR"
 *   badge="i-lucide:check"
 *   badgePosition="bottom-right"
 * />
 * ```
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const local = pick(
    props,
    'src',
    'alt',
    'badge',
    'badgePosition',
    'text',
    'icon',
    'onStatusChange',
    'class',
    'style',
    'classes',
    'styles',
    'size',
  )
  const rest = omit(
    props,
    'src',
    'alt',
    'badge',
    'badgePosition',
    'text',
    'icon',
    'onStatusChange',
    'class',
    'style',
    'classes',
    'styles',
    'size',
  )
  const {
    slots: {
      root: rootSlot,
      image: imageSlot,
      fallback: fallbackSlot,
      fallbackIcon: fallbackIconSlot,
      badge: badgeSlot,
    },
  } = useRecipe(avatarRecipe, local, {
    data: {
      root: avatarDataAttributes.root(() => ({ status })),
      image: avatarDataAttributes.image(() => ({ status })),
      fallback: avatarDataAttributes.fallback(() => ({ status })),
    },
  })

  const source = createMemo(() => local.src?.trim() || undefined)
  const alt = createMemo(() => local.alt)
  const text = createMemo(() => local.text)
  const icon = createMemo(() => local.icon)
  const badge = createMemo(() => local.badge)
  const fallbackText = createMemo(() => resolveFallbackText(text(), alt()))
  const fallbackAccessibleLabel = createMemo(() => alt()?.trim() || text()?.trim() || undefined)
  const rootAriaLabel = createMemo(() => (rest as JSX.AriaAttributes)['aria-label'])
  const [status, setStatusSignal] = createSignal<AvatarT.Status>(
    untrack(source) ? 'loading' : 'error',
  )
  let imageElement: HTMLImageElement | undefined
  let disposed = false
  onCleanup(() => {
    disposed = true
  })

  let currentStatus: AvatarT.Status | undefined

  function setStatus(nextStatus: AvatarT.Status): void {
    if (currentStatus === nextStatus) {
      return
    }

    currentStatus = nextStatus
    setStatusSignal(nextStatus)
    untrack(() => local.onStatusChange)?.(nextStatus)
  }

  createEffect(source, (currentSource) => {
    let cancelled = false

    onCleanup(() => {
      cancelled = true
    })

    if (!currentSource) {
      setStatus('error')
      return
    }

    setStatus('loading')
    queueMicrotask(() => {
      if (cancelled || !imageElement?.complete) {
        return
      }
      setStatus(imageElement.naturalWidth > 0 ? 'loaded' : 'error')
    })
  })

  return (
    <span
      data-slot="avatar"
      role={rootAriaLabel() !== undefined ? 'img' : undefined}
      {...rootSlot}
      {...rest}
    >
      <img
        data-slot="avatar-image"
        {...imageSlot}
        ref={(element) => {
          imageElement = element
        }}
        src={source()}
        onLoad={() => {
          if (!disposed) {
            setStatus('loaded')
          }
        }}
        onError={() => {
          if (!disposed) {
            setStatus('error')
          }
        }}
        alt={alt() ?? ''}
        aria-hidden={rootAriaLabel() !== undefined || status() !== 'loaded' ? 'true' : undefined}
      />

      <span
        data-slot="avatar-fallback"
        {...fallbackSlot}
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
      >
        <Show when={icon()} fallback={fallbackText()}>
          {(fallbackIcon) => (
            <Icon name={fallbackIcon()} data-slot="avatar-fallback-icon" {...fallbackIconSlot} />
          )}
        </Show>
      </span>

      <Show when={badge()}>
        {(badge) => (
          <span data-slot="avatar-badge" {...badgeSlot}>
            <Icon name={badge()} class={AVATAR_BADGE_ICON_CLASS} />
          </span>
        )}
      </Show>
    </span>
  )
}
