import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const formFieldSizeVariants = cva('text-sm', {
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
  },
})

export const formFieldLabelVariants = cva('block font-medium text-foreground', {
  variants: {
    required: {
      true: "after:(ms-0.5 text-destructive) after:content-['*']",
    },
  },
})

export const formFieldContainerVariants = cva('relative', {
  variants: {
    orientation: {
      vertical: 'mt-1',
      horizontal: 'relative',
    },
  },
})

export type FormFieldVariantProps = VariantProps<typeof formFieldSizeVariants> & {
  orientation?: 'vertical' | 'horizontal'
}
