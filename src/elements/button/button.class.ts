import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const buttonVariants = cva(
  'inline-flex cursor-pointer select-none whitespace-nowrap transition items-center justify-center bg-clip-padding focus-visible:effect-fv-border aria-invalid:effect-invalid aria-disabled:effect-dis data-loading:effect-loading disabled:effect-dis active:shadow-none',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-primary-foreground bg-primary shadow hover:bg-primary/90',
        secondary: 'text-secondary-foreground bg-secondary hover:bg-secondary/80',
        outline: 'b-(1 border) bg-background shadow-xs hover:(text-foreground bg-input/30)',
        ghost: 'hover:(text-accent-foreground bg-accent/50)',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'text-destructive-foreground bg-destructive hover:bg-destructive/80',
      },
      size: {
        xs: 'text-xs px-1.5 py-1 rounded-md gap-1 h-6',
        sm: 'text-xs px-2 py-1 rounded-md gap-1.5 h-7',
        md: 'text-sm px-2.5 py-1 rounded-lg gap-1.5 h-8',
        lg: 'text-base px-2.5 py-1 rounded-lg gap-2 h-9',
        xl: 'text-lg px-2.5 py-1 rounded-xl gap-2 h-10',
        'icon-xs': 'text-xs rounded-sm size-6',
        'icon-sm': 'text-xs rounded-sm size-7',
        'icon-md': 'text-sm rounded-md size-8',
        'icon-lg': 'text-base rounded-lg size-9',
        'icon-xl': 'text-lg rounded-xl size-10',
      },
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
