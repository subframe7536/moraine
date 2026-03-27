import type { ClassValue } from 'cls-variant'
import type { JSX } from 'solid-js'

export type SlotClasses<TSlot extends string> = Partial<Record<TSlot, ClassValue>>

export type SlotStyles<TSlot extends string> = Partial<Record<TSlot, JSX.CSSProperties>>

export type BaseProps<
  B,
  V,
  E,
  TSlot extends string,
  ExtraOmitKeys extends PropertyKey = never,
> = B &
  V &
  ([E] extends [never]
    ? {}
    : Omit<
        E,
        | keyof (B & V)
        | 'children'
        | 'class'
        | 'style'
        | 'classes'
        | 'styles'
        | Extract<ExtraOmitKeys, keyof E>
      >) & {
    classes?: SlotClasses<TSlot>
    styles?: SlotStyles<TSlot>
  }
