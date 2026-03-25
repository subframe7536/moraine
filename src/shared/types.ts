import type { ClassValue } from 'cls-variant'
import type { JSX } from 'solid-js'

export type SlotClasses<TSlot extends string> = Partial<Record<TSlot, ClassValue>>

export type SlotStyles<TSlot extends string> = Partial<Record<TSlot, JSX.CSSProperties>>

export type BaseProps<B, V, E, TSlot extends string, ExtraOmitKeys extends keyof E = never> = B &
  V &
  Omit<E, keyof (B & V) | 'children' | 'class' | 'style' | 'classes' | 'styles' | ExtraOmitKeys> & {
    classes?: SlotClasses<TSlot>
    styles?: SlotStyles<TSlot>
  }
