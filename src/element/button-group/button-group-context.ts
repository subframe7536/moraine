import { createContextProvider } from '../../shared/create-context-provider'
import type { ButtonT } from '../button/button.types'

import type { ButtonGroupT } from './button-group.types'

export interface ButtonGroupContextValue {
  readonly size?: ButtonT.Variants['size']
  readonly variant?: ButtonT.Variants['variant']
  readonly tone?: ButtonT.Variants['tone']
  readonly orientation?: ButtonGroupT.Variants['orientation']
  readonly slotOverrides?: {
    readonly classes?: ButtonGroupT.Classes
    readonly styles?: ButtonGroupT.Styles
  }
}

export const [ButtonGroupProvider, useButtonGroupContext] =
  /* @__PURE__ */ createContextProvider<ButtonGroupContextValue>('ButtonGroup', {})
