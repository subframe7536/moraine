import type { ClassValue } from 'cls-variant'
import type { JSX } from 'solid-js'

export type SlotClassValue = ClassValue

export type SlotStyleValue = JSX.CSSProperties

export type SlotClasses<TSlot> = [TSlot] extends [string]
  ? Partial<Record<TSlot, ClassValue>>
  : {
      [K in Extract<keyof TSlot, string>]?: ClassValue
    }

export type SlotStyles<TSlot> = [TSlot] extends [string]
  ? Partial<Record<TSlot, JSX.CSSProperties>>
  : {
      [K in Extract<keyof TSlot, string>]?: JSX.CSSProperties
    }

export type BaseProps<B, V, E, TClasses, TStyles, ExtraOmitKeys extends PropertyKey = never> = B &
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
    /** Class applied to the component root element. */
    class?: ClassValue
    /** Style applied to the component root element. */
    style?: JSX.CSSProperties
    /** Classes applied to the component slots. */
    classes?: TClasses
    /** Styles applied to the component slots. */
    styles?: TStyles
  }
