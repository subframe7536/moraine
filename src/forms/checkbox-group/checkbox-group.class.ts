import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const checkboxGroupFieldsetVariants = cva('flex', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
})

export const checkboxGroupLegendVariants = cva('mb-1 block font-medium text-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
    required: {
      true: "after:(ms-0.5 text-destructive) after:content-['*']",
    },
  },
})

export const checkboxGroupItemVariants = cva('', {
  defaultVariants: {
    disabled: false,
  },
  variants: {
    tableSize: {
      xs: 'p-2.5',
      sm: 'p-3',
      md: 'p-3.5',
      lg: 'p-4',
      xl: 'p-4.5',
    },
    tableOrientation: {
      horizontal: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg not-first-of-type:-ms-px',
      vertical: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg not-first-of-type:-mt-px',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})
export type CheckboxGroupVariantProps = VariantProps<typeof checkboxGroupFieldsetVariants> &
  VariantProps<typeof checkboxGroupLegendVariants> & {
    variant?: 'list' | 'card' | 'table'
  }
