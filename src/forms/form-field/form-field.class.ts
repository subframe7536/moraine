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

export const formFieldRootVariants = cva('text-sm', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      vertical: '',
      horizontal: 'gap-x-2 grid grid-cols-4 items-baseline',
    },
  },
})

export const formFieldLabelVariants = cva('text-foreground font-medium block', {
  variants: {
    required: REQUIRED_MARK_VARIANT,
    orientation: {
      vertical: '',
      horizontal: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      required: true,
      class: "before:(text-destructive me-0.5 content-['*']) after:content-none",
    },
  ],
})

export const formFieldContainerVariants = cva('flex flex-col gap-1 relative', {
  variants: {
    orientation: {
      vertical: 'mt-1',
      horizontal: 'col-span-3 min-w-0',
    },
  },
})

export type FormFieldVariantProps = VariantProps<typeof formFieldSizeVariants> & {
  orientation?: 'vertical' | 'horizontal'
}
