import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const buttonVariants = cva(
  'border inline-flex cursor-pointer select-none whitespace-nowrap transition-[colors,transform] items-center justify-center bg-clip-padding focus-visible:effect-fv-border aria-invalid:effect-invalid aria-disabled:effect-dis disabled:effect-dis [&:active:not([aria-haspopup])]:translate-y-px',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'text-primary-foreground border-transparent bg-primary active:bg-primary-active hover:bg-primary-hover',
        secondary:
          'text-secondary-foreground border-transparent bg-secondary active:bg-secondary-active hover:bg-secondary-hover',
        outline:
          'border-border bg-background hover:(text-foreground bg-background-hover) dark:border-input active:bg-background-active',
        ghost:
          'border-transparent active:(text-foreground bg-muted-active) hover:(text-foreground bg-muted-hover)',
        link: 'text-primary border-transparent underline-offset-4 hover:underline',
        destructive:
          'text-destructive-foreground border-transparent bg-destructive focus-visible:border-destructive/40 active:bg-destructive-active hover:bg-destructive-hover focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
      size: {
        sm: 'text-sm px-2.5 rounded-md gap-1 h-7',
        md: 'text-sm px-2.5 rounded-lg gap-1.5 h-8',
        lg: 'text-sm px-2.5 rounded-lg gap-1.5 h-9',
        'icon-sm': 'text-sm rounded-md size-7',
        'icon-md': 'text-sm rounded-lg size-8',
        'icon-lg': 'text-sm rounded-lg size-9',
      },
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
