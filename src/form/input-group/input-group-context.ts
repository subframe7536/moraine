import { createContextProvider } from '../../shared/create-context-provider'

import type { InputGroupT } from './input-group.types'

export interface InputGroupContextValue {
  readonly grouped?: boolean
  readonly variant?: InputGroupT.Variant['variant']
  readonly size?: InputGroupT.Variant['size']
  readonly orientation?: InputGroupT.Variant['orientation']
  readonly slotOverrides?: { classes?: InputGroupT.Classes; styles?: InputGroupT.Styles }
}

export const [InputGroupProvider, useInputGroupContext] =
  /* @__PURE__ */ createContextProvider<InputGroupContextValue>('InputGroup', {
    grouped: false,
  })
