import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const separatorVariants = cva('border-current bg-border shrink-0', {
  defaultVariants: {
    orientation: 'horizontal',
    size: 'sm',
    type: 'solid',
  },
  variants: {
    orientation: {
      horizontal: 'b-t h-px w-full',
      vertical: 'b-s h-full w-px',
    },
    size: {
      sm: 'b-2',
      md: 'b-3',
      lg: 'b-4',
    },
    type: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
  },
})

export type SeparatorVariantProps = VariantProps<typeof separatorVariants>
