import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const textareaRootVariants = cva(
  'inline-flex w-full rounded-md border transition-shadow overflow-hidden',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'outline',
    },
    variants: {
      color: {
        primary: 'focus-within:(ring-2 ring-inset ring-primary)',
        secondary: 'focus-within:(ring-2 ring-inset ring-secondary)',
        neutral: 'focus-within:(ring-2 ring-inset ring-neutral)',
        error: 'focus-within:(ring-2 ring-inset ring-destructive)',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base',
      },
      variant: {
        outline: 'border border-input bg-background',
        soft: 'border-transparent bg-muted/50 hover:bg-muted',
        subtle: 'border border-border bg-muted',
        ghost: 'border-transparent bg-transparent hover:bg-muted',
        none: 'border-transparent bg-transparent',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-75',
      },
      fieldGroup: {
        horizontal: '',
        vertical: '',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: 'true', class: 'ring-primary' },
      { color: 'secondary', highlight: 'true', class: 'ring-secondary' },
      { color: 'neutral', highlight: 'true', class: 'ring-foreground' },
      { color: 'error', highlight: 'true', class: 'ring-destructive' },
    ],
  },
)

export const textareaBaseVariants = cva(
  'flex-1 min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
  {
    defaultVariants: {
      size: 'md',
      autoresize: false,
    },
    variants: {
      size: {
        xs: 'min-h-17 py-1',
        sm: 'min-h-18 py-1.5',
        md: 'min-h-20 py-1.5',
        lg: 'min-h-22 py-2',
        xl: 'min-h-24 py-2',
      },
      autoresize: {
        true: 'resize-none',
        false: 'resize-y',
      },
    },
  },
)

export const textareaSizePadding = {
  xs: { start: 'ps-2', end: 'pe-2' },
  sm: { start: 'ps-2.5', end: 'pe-2.5' },
  md: { start: 'ps-2.5', end: 'pe-2.5' },
  lg: { start: 'ps-3', end: 'pe-3' },
  xl: { start: 'ps-3', end: 'pe-3' },
} as const

export type TextareaVariantProps = VariantProps<typeof textareaRootVariants> &
  VariantProps<typeof textareaBaseVariants>
