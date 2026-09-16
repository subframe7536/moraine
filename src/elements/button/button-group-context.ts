import { createContext } from 'solid-js'

import type { ButtonGroupT } from './button-group.types'
import type { ButtonT } from './button.types'

export interface ButtonGroupContextValue {
  readonly size?: ButtonT.Variant['size']
  readonly variant?: ButtonT.Variant['variant']
  readonly presentation?: {
    readonly classes?: ButtonGroupT.Classes
    readonly styles?: ButtonGroupT.Styles
  }
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>()
