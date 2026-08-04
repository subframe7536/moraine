import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const buttonVariants = cva(
  'inline-flex cursor-pointer select-none whitespace-nowrap transition-all items-center justify-center bg-clip-padding focus-visible:effect-fv-border aria-invalid:effect-invalid aria-disabled:effect-dis disabled:effect-dis [&:active:not([aria-haspopup])]:translate-y-px',
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
