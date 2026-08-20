import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const separatorRootVariants = cva('text-border text-center flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'flex-row w-full',
      vertical: 'flex-col h-full min-h-10',
    },
  },
})

export const separatorBorderVariants = cva('border-current bg-border flex-1 shrink-0', {
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

export const separatorContentVariants = cva('font-medium flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'mx-3 whitespace-nowrap',
      vertical: 'my-2',
    },
  },
})

export type SeparatorVariantProps = VariantProps<typeof separatorBorderVariants>
