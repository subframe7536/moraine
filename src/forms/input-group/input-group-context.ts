import { createContextProvider } from '../../shared/create-context-provider.tsx'

import type { InputGroupT } from './input-group.types.ts'

interface InputGroupContextValue {
  readonly size: InputGroupT.Variant['size']
  readonly orientation: InputGroupT.Variant['orientation']
  readonly presentation: { classes?: InputGroupT.Classes; styles?: InputGroupT.Styles }
}

export const [InputGroupProvider, useInputGroupContext] =
  createContextProvider<InputGroupContextValue | null>('InputGroup', null)
