import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const listBoxContentVariants = cva('flex flex-col', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'gap-0.5',
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1',
      xl: 'gap-1.5',
    },
  },
})

export const listBoxItemVariants = cva(
  'outline-none rounded-sm flex gap-2 w-full cursor-pointer items-center justify-between data-highlighted:(text-accent-foreground bg-accent) data-selected:(text-accent-foreground bg-accent) data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs px-2 py-0.5 min-h-6',
        sm: 'text-xs px-2 py-1 min-h-7',
        md: 'text-sm px-2.5 py-1 min-h-8',
        lg: 'text-sm px-3 py-1.5 min-h-9',
        xl: 'text-base px-3.5 py-1.5 min-h-10',
      },
    },
  },
)

export type ListBoxVariantProps = VariantProps<typeof listBoxContentVariants> &
  VariantProps<typeof listBoxItemVariants>
