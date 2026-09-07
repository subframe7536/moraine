import type { JSX } from 'solid-js'
import { createContext } from 'solid-js'

import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { ButtonVariantProps } from './button.class.ts'

export interface ButtonGroupContextValue {
  readonly size?: ButtonVariantProps['size']
  readonly variant?: ButtonVariantProps['variant']
  readonly class?: SlotClassValue
  readonly classes?: Record<string, SlotClassValue>
  readonly style?: JSX.CSSProperties
  readonly styles?: Record<string, SlotStyleValue>
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>()
