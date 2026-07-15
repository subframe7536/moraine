import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const commandPaletteItemVariants = cva(
  'outline-none rounded-md flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
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

export type CommandPaletteItemVariantProps = VariantProps<typeof commandPaletteItemVariants>
