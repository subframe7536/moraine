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

export type BaseProps<Base, Variant, TSlot> = Base &
  ([Variant] extends [never] ? {} : Variant) & {
    /** Class applied to the component root or trigger element. */
    class?: ClassValue
    /** Style applied to the component root or trigger element. */
    style?: JSX.CSSProperties
    /** Classes applied to the component slots. */
    classes?: { [K in keyof TSlot]?: ClassValue }
    /** Styles applied to the component slots. */
    styles?: { [K in keyof TSlot]?: JSX.CSSProperties }
  }
