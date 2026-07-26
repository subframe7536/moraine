import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const buttonVariants = cva(
  'inline-flex cursor-pointer select-none whitespace-nowrap transition-all items-center justify-center bg-clip-padding focus-visible:effect-fv-border aria-invalid:effect-invalid aria-disabled:effect-dis disabled:effect-dis [&:active:not([aria-haspopup])]:translate-y-px',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-primary-foreground bg-primary hover:bg-primary/90',
        secondary: 'text-secondary-foreground bg-secondary hover:bg-secondary/80',
        outline:
          'surface-border bg-background hover:text-foreground dark:border-input dark:bg-input/30 hover:bg-muted dark:hover:bg-input/50',
        ghost: 'hover:(text-foreground bg-muted dark:bg-muted/50)',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'text-destructive bg-destructive/10 focus-visible:border-destructive/40 dark:bg-destructive/20 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
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
