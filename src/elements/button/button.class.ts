import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const buttonVariants = cva(
  'border border-transparent inline-flex cursor-pointer select-none whitespace-nowrap transition-all items-center justify-center bg-clip-padding focus-visible:effect-fv-border aria-invalid:effect-invalid aria-disabled:effect-dis disabled:effect-dis [&:active:not([aria-haspopup])]:translate-y-px',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'text-primary-foreground bg-primary active:bg-primary-active hover:bg-primary-hover',
        secondary:
          'text-secondary-foreground bg-secondary active:bg-secondary-active hover:bg-secondary-hover',
        outline:
          'surface-border bg-background hover:(text-foreground bg-background-hover) dark:border-input active:bg-background-active',
        ghost: 'active:(text-foreground bg-muted-active) hover:(text-foreground bg-muted-hover)',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'text-destructive-foreground bg-destructive focus-visible:border-destructive/40 active:bg-destructive-active hover:bg-destructive-hover focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
      size: {
        xs: 'text-xs px-2 rounded-md gap-1 h-6',
        sm: 'text-sm px-2.5 rounded-md gap-1 h-8',
        md: 'text-sm px-2.5 rounded-md gap-1.5 h-9',
        lg: 'text-sm px-2.5 rounded-md gap-1.5 h-10',
        xl: 'text-base px-3 rounded-md gap-1.5 h-11',
        'icon-xs': 'text-xs rounded-md size-6',
        'icon-sm': 'text-sm rounded-md size-8',
        'icon-md': 'text-sm rounded-md size-9',
        'icon-lg': 'text-sm rounded-md size-10',
        'icon-xl': 'text-base rounded-md size-11',
      },
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
