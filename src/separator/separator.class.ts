import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const separatorRootVariants = cva('flex items-center text-center text-muted', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'w-full flex-row',
      vertical: 'h-full min-h-10 flex-col',
    },
  },
})

export const separatorBorderVariants = cva('flex-1 shrink-0 border-current', {
  defaultVariants: {
    orientation: 'horizontal',
    size: 'xs',
    type: 'solid',
  },
  variants: {
    orientation: {
      horizontal: 'w-full b-t',
      vertical: 'h-full b-s',
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

export const separatorContainerVariants = cva('flex items-center font-medium', {
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
