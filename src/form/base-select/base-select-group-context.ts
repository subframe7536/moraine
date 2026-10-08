import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'

export interface BaseSelectGroupContextValue {
  labelId: Accessor<string | undefined>
  setLabelId: (id: string | undefined) => void
}

export const [GroupProvider, useGroupContext] =
  /* @__PURE__ */ createContextProvider<BaseSelectGroupContextValue | null>('BaseSelectGroup', null)
