import { createContextProvider } from '../../shared/create-context-provider'
import type { ButtonT } from '../button/button.types'

import type { ButtonGroupT } from './button-group.types'

export interface ButtonGroupContextValue {
  readonly size?: ButtonT.Variant['size'] | null
  readonly variant?: ButtonT.Variant['variant'] | null
  readonly orientation?: ButtonGroupT.Variant['orientation'] | null
  readonly presentation?: {
    readonly classes?: ButtonGroupT.Classes
    readonly styles?: ButtonGroupT.Styles
  }
}

export const [ButtonGroupProvider, useButtonGroupContext] =
  /* @__PURE__ */ createContextProvider<ButtonGroupContextValue | null>('ButtonGroup', null)
