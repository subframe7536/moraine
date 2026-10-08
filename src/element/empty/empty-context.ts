import { createContextProvider } from '../../shared/create-context-provider'

import type { EmptyT } from './empty.types'

interface EmptyContext {
  readonly size: EmptyT.Variant['size']
  readonly presentation: {
    readonly classes?: EmptyT.Classes
    readonly styles?: EmptyT.Styles
  }
}

export const [EmptyProvider, useEmptyContext] =
  /* @__PURE__ */ createContextProvider<EmptyContext>('Empty')
