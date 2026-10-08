import type { Accessor } from 'solid-js'

import { useMoraineContext } from '../moraine-context'

import { FALLBACK_LOCALE } from './default-locale'
import { mergeMessagesInput } from './merge-messages'
import type { MoraineMessages, MoraineMessagesInput } from './messages.types'

export interface ResolvedLocale {
  locale: string
  dir?: 'ltr' | 'rtl'
  messages?: MoraineMessagesInput
}

export interface MoraineLocale {
  /** BCP 47 locale from the nearest provider. Guaranteed fallback is `en-US`. */
  locale: Accessor<string>
  /** Direction from the nearest provider. Undefined follows `<html dir>` / the document. */
  dir: Accessor<'ltr' | 'rtl' | undefined>
}

/** Stable accessors for the nearest provider locale and direction. */
export function useLocale(): MoraineLocale {
  const context = useMoraineContext()
  return {
    locale: () => context.locale.locale,
    dir: () => context.locale.dir,
  }
}

const groupCache = new WeakMap<object, WeakMap<object, object>>()

function mergeGroup<T extends object>(defaults: T, custom: Partial<T> | undefined): T {
  if (!custom || typeof custom !== 'object') {
    return defaults
  }
  let byDefaults = groupCache.get(defaults)
  if (!byDefaults) {
    byDefaults = new WeakMap()
    groupCache.set(defaults, byDefaults)
  }
  const cached = byDefaults.get(custom) as T | undefined
  if (cached) {
    return cached
  }
  const result = { ...defaults }
  for (const key of Object.keys(custom) as (keyof T)[]) {
    if (custom[key] !== undefined) {
      result[key] = custom[key]!
    }
  }
  const merged = Object.freeze(result)
  byDefaults.set(custom, merged)
  return merged
}

/** Accessor for a component's merged message group. */
export function useMessages<K extends keyof MoraineMessages>(
  key: K,
  defaults: MoraineMessages[K],
): Accessor<MoraineMessages[K]> {
  const context = useMoraineContext()
  return () => {
    const custom = context.locale.messages?.[key]
    return mergeGroup(defaults, custom)
  }
}

export function resolveLocale(
  parent: ResolvedLocale,
  next: {
    locale?: string
    dir?: 'ltr' | 'rtl' | null
    messages?: MoraineMessagesInput
    detectLocale?: boolean
    detectedLocale?: string
  },
): ResolvedLocale {
  if (
    next.locale === undefined &&
    !next.detectLocale &&
    next.dir === undefined &&
    next.messages === undefined
  ) {
    return parent
  }

  const locale =
    next.locale !== undefined
      ? next.locale
      : next.detectLocale
        ? (next.detectedLocale ?? FALLBACK_LOCALE)
        : parent.locale
  const dir = next.dir === null ? undefined : next.dir === undefined ? parent.dir : next.dir
  const messages =
    next.messages === undefined
      ? parent.messages
      : mergeMessagesInput(parent.messages, next.messages)

  if (locale === parent.locale && dir === parent.dir && messages === parent.messages) {
    return parent
  }

  return { locale, dir, messages }
}
