import type { ClassValue } from 'cls-variant'
import type { JSX } from 'solid-js'

/**
 * Generic slot classes map for component APIs.
 */
export type SlotClasses<TSlot extends string> = Partial<Record<TSlot, ClassValue>>

/**
 * Generic slot styles map for component APIs. Only supports JS objects, no string styling.
 */
export type SlotStyles<TSlot extends string> = Partial<Record<TSlot, JSX.CSSProperties>>
