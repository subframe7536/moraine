import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

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

export const formFieldLabelVariants = cva('text-foreground font-medium block', {
  variants: {
    required: {
      true: "after:(text-destructive ms-0.5 content-['*'])",
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
