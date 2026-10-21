import { createContextProvider } from '../../shared/create-context-provider'

import type { InputGroupT } from './input-group.types'

export interface InputGroupContextValue {
  readonly grouped?: boolean
  readonly variant?: InputGroupT.Variants['variant']
  readonly size?: InputGroupT.Variants['size']
  readonly orientation?: InputGroupT.Variants['orientation']
  readonly slotOverrides?: { classes?: InputGroupT.Classes; styles?: InputGroupT.Styles }
}

export const [InputGroupProvider, useInputGroupContext] =
  /* @__PURE__ */ createContextProvider<InputGroupContextValue>('InputGroup', {
    grouped: false,
  })
