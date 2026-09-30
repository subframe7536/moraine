import { createContextProvider } from '../../shared/create-context-provider'

import type { InputGroupT } from './input-group.types'

interface InputGroupContextValue {
  readonly variant: InputGroupT.Variant['variant'] | null
  readonly size: InputGroupT.Variant['size'] | null
  readonly orientation: InputGroupT.Variant['orientation'] | null
  readonly presentation: { classes?: InputGroupT.Classes; styles?: InputGroupT.Styles }
}

export const [InputGroupProvider, useInputGroupContext] =
  createContextProvider<InputGroupContextValue | null>('InputGroup', null)
