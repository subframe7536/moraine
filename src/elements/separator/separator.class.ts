import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const separatorRootVariants = cva('text-muted text-center flex items-center', {
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

export const separatorBorderVariants = cva('border-current flex-1 shrink-0', {
  defaultVariants: {
    orientation: 'horizontal',
    size: 'xs',
    type: 'solid',
  },
  variants: {
    orientation: {
      horizontal: 'b-t w-full',
      vertical: 'b-s h-full',
    },
    size: {
      xs: 'b-1',
      sm: 'b-2',
      md: 'b-3',
      lg: 'b-4',
      xl: 'b-5',
    },
    type: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
  },
})

export const separatorContainerVariants = cva('font-medium flex items-center', {
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

export type SeparatorVariantProps = VariantProps<typeof separatorRootVariants> &
  VariantProps<typeof separatorBorderVariants> &
  VariantProps<typeof separatorContainerVariants>
