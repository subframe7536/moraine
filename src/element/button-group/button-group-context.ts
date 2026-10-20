import { createContextProvider } from '../../shared/create-context-provider'
import type { ButtonT } from '../button/button.types'

import type { ButtonGroupT } from './button-group.types'

export interface ButtonGroupContextValue {
  readonly size?: ButtonT.Variant['size']
  readonly variant?: ButtonT.Variant['variant']
  readonly tone?: ButtonT.Variant['tone']
  readonly orientation?: ButtonGroupT.Variant['orientation']
  readonly slotOverrides?: {
    readonly classes?: ButtonGroupT.Classes
    readonly styles?: ButtonGroupT.Styles
  }
}

export const [ButtonGroupProvider, useButtonGroupContext] =
  /* @__PURE__ */ createContextProvider<ButtonGroupContextValue>('ButtonGroup', {})
