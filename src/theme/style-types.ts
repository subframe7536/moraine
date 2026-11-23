import type { JSX } from '@solidjs/web'

export type { ClassValue as SlotClassValue } from 'cn'

export type SlotStyleValue = JSX.CSSProperties

export type ComponentSize = 'sm' | 'md' | 'lg'
export type Orientation = 'horizontal' | 'vertical'
export type TextControlVariant = 'outline' | 'subtle' | 'ghost' | 'none'

export type OverlayPlacement = 'top' | 'right' | 'bottom' | 'left'
export type OverlayAlign = 'start' | 'center' | 'end'
