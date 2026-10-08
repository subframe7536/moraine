import { useContext } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider'
import type { Cn } from '../theme/cn'
import { cn } from '../theme/cn'

import { FALLBACK_LOCALE } from './locale/default-locale'
import type { ResolvedLocale } from './locale/locale-context'
import type { ThemeResolver } from './theme-context'
import { defaultRecipeResolver } from './theme-context'

export interface MoraineContext {
  readonly resolver: ThemeResolver
  readonly cn: Cn
  readonly locale: ResolvedLocale
}

const defaultLocale: ResolvedLocale = /* @__PURE__ */ Object.freeze({
  locale: FALLBACK_LOCALE,
})

const defaultMoraineContext: MoraineContext = /* @__PURE__ */ Object.freeze({
  resolver: defaultRecipeResolver,
  cn,
  locale: defaultLocale,
})

const [MoraineContextProvider, useMoraineContext, moraineContext] =
  /* @__PURE__ */ createContextProvider<MoraineContext>('Moraine', defaultMoraineContext)

export { MoraineContextProvider, useMoraineContext }

export function useMoraineParent(): { parent: MoraineContext; provided: boolean } {
  const parent = useContext(moraineContext)
  return {
    parent: parent ?? defaultMoraineContext,
    provided: parent !== undefined,
  }
}
