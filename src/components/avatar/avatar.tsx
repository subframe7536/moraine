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

import { useRecipe } from '../../provider'
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

export function Avatar(props: AvatarProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'src',
    'alt',
    'badge',
    'badgePosition',
    'slotName',
    'text',
    'fallback',
    'onStatusChange',
    'class',
    'style',
    'classes',
    'styles',
    'size',
  ])
  const { slots } = useRecipe(avatarRecipe, local)

  const slotName = () => local.slotName ?? 'avatar'
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
      data-slot={slotName()}
      {...avatarDataAttributes.root({ status })}
      role={rootAriaLabel() !== undefined ? 'img' : undefined}
      {...rest}
      {...slots.root}
    >
      <img
        data-slot={`${slotName()}-image`}
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
        {...slots.image}
      />

      <span
        data-slot={`${slotName()}-fallback`}
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
        {...slots.fallback}
      >
        <Show when={fallback()} fallback={fallbackText()}>
          {(fallbackContent) => (
            <Icon
              name={fallbackContent()}
              slotName={`${slotName()}-fallback-content`}
              {...slots.fallbackContent}
            />
          )}
        </Show>
      </span>

      <Show when={badge()}>
        {(badge) => (
          <span data-slot={`${slotName()}-badge`} {...slots.badge}>
            <Icon name={badge()} class={AVATAR_BADGE_ICON_CLASS} />
          </span>
        )}
      </Show>
    </span>
  )
}
