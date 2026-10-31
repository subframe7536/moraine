import { createContextProvider } from '../shared/create-context-provider'
import type { Cn } from '../theme/cn'
import type { MoraineTheme } from '../theme/types'

import type { MoraineMessagesInput } from './locale/messages.types'

export interface MoraineContext {
  /** Effective Theme after inheritance; `null` means built-in recipes only. */
  readonly theme: MoraineTheme | null
  readonly cn: Cn
  readonly locale: string
  readonly dir?: 'ltr' | 'rtl'
  readonly messages?: MoraineMessagesInput
}

export const [MoraineContextProvider, useMoraineContext] =
  /* @__PURE__ */ createContextProvider<MoraineContext | null>('Moraine', null)
