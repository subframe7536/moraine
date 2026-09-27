import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { createStyles } from '../../provider'
import type { SlotClassValue } from '../../shared/types'
import { Icon } from '../icon'

import { avatarDataAttributes, avatarRecipe } from './avatar.recipe'
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

interface AvatarFaceProps extends AvatarT.Base {
  class?: SlotClassValue
  style?: JSX.CSSProperties
  classes?: AvatarT.Classes
  styles?: AvatarT.Styles
  size?: AvatarT.Variant['size'] | null
  rootSlot?: 'avatar' | 'avatar-group-item'
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
  const resolved = createStyles(avatarRecipe, local)

  const source = createMemo(() => local.src?.trim() || undefined)
  const alt = createMemo(() => local.alt)
  const text = createMemo(() => local.text)
  const fallback = createMemo(() => local.fallback)
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

  createEffect(
    on(source, (currentSource) => {
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
    }),
  )

  return (
    <span
      data-slot={local.rootSlot ?? 'avatar'}
      {...avatarDataAttributes.root({ status })}
      role={rootAriaLabel() !== undefined ? 'img' : undefined}
      {...rest}
      {...resolved.styles.root}
    >
      <img
        data-slot="avatar-image"
        {...avatarDataAttributes.image({ status })}
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
        {...resolved.styles.image}
      />

      <span
        data-slot="avatar-fallback"
        {...avatarDataAttributes.fallback({ status })}
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
        {...resolved.styles.fallback}
      >
        <Show when={fallback()} fallback={fallbackText()}>
          {(fallbackContent) => (
            <Icon
              name={fallbackContent()}
              slotName="avatar-fallback-content"
              {...resolved.styles.fallbackContent}
            />
          )}
        </Show>
      </span>

      <Show when={badge()}>
        {(badge) => (
          <span data-slot="avatar-badge" {...resolved.styles.badge}>
            <Icon name={badge()} />
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
