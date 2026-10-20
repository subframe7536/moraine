import { createContextProvider } from '../shared/create-context-provider'
import type { Cn } from '../theme/cn'

import type { MoraineMessagesInput } from './locale/messages.types'
import type { ThemeResolver } from './theme-context'

export interface MoraineContext {
  readonly resolver: ThemeResolver
  readonly cn: Cn
  readonly locale: string
  readonly dir?: 'ltr' | 'rtl'
  readonly messages?: MoraineMessagesInput
}

export const [MoraineContextProvider, useMoraineContext] =
  /* @__PURE__ */ createContextProvider<MoraineContext | null>('Moraine', null)
