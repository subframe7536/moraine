import type { ClassValue } from 'cls-variant'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'

export type SlotClasses<TSlot extends string> = Partial<Record<TSlot, ClassValue>>

export type SlotStyles<TSlot extends string> = Partial<Record<TSlot, JSX.CSSProperties>>

export type ElementOf<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

export type PolymorphicProps<T extends ValidComponent, Props = {}> = Props & {
  as?: T
} & Omit<ComponentProps<T>, keyof Props | 'as'>

export type BaseProps<
  B,
  V,
  E,
  TSlot extends string,
  ExtraOmitKeys extends PropertyKey = never,
> = B &
  ([V] extends [never] ? {} : V) &
  ([E] extends [never]
    ? {}
    : Omit<
        E,
        | keyof (B & ([V] extends [never] ? {} : V))
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
