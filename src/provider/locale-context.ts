import type { Accessor } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider'

import { enMessages } from './locale/en'
import { mergeMessages } from './locale/merge-messages'
import type { MoraineMessages, MoraineMessagesInput } from './locale/messages.types'

export interface ResolvedLocale {
  locale?: string
  dir?: 'ltr' | 'rtl'
  messages: MoraineMessages
}

export const DEFAULT_LOCALE: ResolvedLocale = {
  messages: enMessages,
}

const defaultLocale = (): ResolvedLocale => DEFAULT_LOCALE

export const [MoraineLocaleProvider, useLocaleAccessor] = createContextProvider<
  Accessor<ResolvedLocale>
>('MoraineLocale', defaultLocale)

export interface MoraineLocale {
  /** BCP 47 locale inherited from the nearest provider. Undefined uses the runtime default. */
  locale: Accessor<string | undefined>
  /** Direction inherited from the nearest provider. Undefined leaves detection to the document. */
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
  next: { locale?: string; dir?: 'ltr' | 'rtl'; messages?: MoraineMessagesInput },
): ResolvedLocale {
  return {
    locale: next.locale === undefined ? parent.locale : next.locale,
    dir: next.dir === undefined ? parent.dir : next.dir,
    messages:
      next.messages === undefined ? parent.messages : mergeMessages(parent.messages, next.messages),
  }
}
