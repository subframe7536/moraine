import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const kbdRootVariants = cva(
  'leading-none font-medium font-mono px-1 rounded-sm inline-flex select-none uppercase items-center justify-center',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      size: {
        sm: 'text-[10px] h-4.5 min-w-4.5',
        md: 'text-xs h-5 min-w-5',
        lg: 'text-sm h-5.5 min-w-5.5',
      },
      variant: {
        default: 'text-muted-foreground bg-muted',
        outline: 'text-muted-foreground border border-b-2 border-border',
        invert: 'text-muted bg-muted-foreground',
      },
    },
  },
)

export const kbdGroupVariants = cva('inline-flex gap-1 items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-[11px]',
      md: 'text-xs',
      lg: 'text-xs',
    },
  },
})

export const KBD_GROUP_CHORD_CLASS = 'inline-flex gap-1 items-center'
export const KBD_GROUP_DIVIDER_CLASS = 'text-muted-foreground'

export type KbdVariantProps = VariantProps<typeof kbdRootVariants>
export type KbdGroupVariantProps = VariantProps<typeof kbdRootVariants> &
  VariantProps<typeof kbdGroupVariants>
