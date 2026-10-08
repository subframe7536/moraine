import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'

import { getDefaultLocaleTag } from './default-locale'
import { enMessages } from './en'
import { mergeMessages } from './merge-messages'
import type { MoraineMessages, MoraineMessagesInput } from './messages.types'

export interface ResolvedLocale {
  locale: string
  dir?: 'ltr' | 'rtl'
  messages: MoraineMessages
}

function getDefaultResolvedLocale(): ResolvedLocale {
  return {
    locale: getDefaultLocaleTag(),
    messages: enMessages,
  }
}

export const [MoraineLocaleProvider, useLocaleAccessor] = createContextProvider<
  Accessor<ResolvedLocale>
>('MoraineLocale', getDefaultResolvedLocale)

export interface MoraineLocale {
  /** BCP 47 locale from the nearest provider, otherwise the browser language. SSR fallback is `en-US`. */
  locale: Accessor<string>
  /** Direction from the nearest provider. Undefined follows `<html dir>` / the document. */
  dir: Accessor<'ltr' | 'rtl' | undefined>
}

/** Stable accessors for the nearest provider locale and direction. */
export function useLocale(): MoraineLocale {
  const current = useLocaleAccessor()
  return {
    locale: () => current().locale,
    dir: () => current().dir,
  }
}

/** Accessor for the nearest merged message pack. */
export function useMessages(): Accessor<MoraineMessages> {
  const current = useLocaleAccessor()
  return () => current().messages
}

export function resolveLocale(
  parent: ResolvedLocale,
  next: { locale?: string; dir?: 'ltr' | 'rtl' | null; messages?: MoraineMessagesInput },
): ResolvedLocale {
  if (next.locale === undefined && next.dir === undefined && next.messages === undefined) {
    return parent
  }

  const locale = next.locale === undefined ? parent.locale : next.locale
  const dir = next.dir === null ? undefined : next.dir === undefined ? parent.dir : next.dir
  const messages =
    next.messages === undefined ? parent.messages : mergeMessages(parent.messages, next.messages)

  if (locale === parent.locale && dir === parent.dir && messages === parent.messages) {
    return parent
  }

  return { locale, dir, messages }
}
