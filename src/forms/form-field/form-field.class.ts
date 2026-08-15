import type { VariantProps } from 'cls-variant'

import { REQUIRED_MARK_VARIANT, TEXT_SIZE_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const formFieldSizeVariants = cva('text-sm', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const formFieldRootVariants = cva('text-sm flex flex-col gap-3', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      vertical: '',
      horizontal: 'flex-row items-baseline justify-between',
    },
  },
})

export const formFieldLabelVariants = cva('text-foreground font-medium block', {
  variants: {
    required: REQUIRED_MARK_VARIANT,
  },
})

export const formFieldContainerVariants = cva('flex flex-col gap-1 relative', {
  variants: {
    orientation: {
      vertical: '',
      horizontal: 'flex-1',
    },
  },
})

export type FormFieldVariantProps = VariantProps<typeof formFieldSizeVariants> & {
  orientation?: 'vertical' | 'horizontal'
}
