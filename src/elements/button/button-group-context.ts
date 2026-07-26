import { createContext } from 'solid-js'

import type { ButtonVariantProps } from './button.class'

export interface ButtonGroupContextValue {
  readonly size: ButtonVariantProps['size']
  readonly variant: ButtonVariantProps['variant']
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>()
