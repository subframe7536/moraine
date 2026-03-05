import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md bg-clip-padding whitespace-nowrap font-500 transition-[background-color,box-shadow] cursor-pointer select-none text-base focus-visible:effect-fv-border aria-invalid:(border-destructive ring-3 ring-destructive/20) dark:aria-invalid:ring-destructive/40 disabled:effect-dis active:shadow-none',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border bg-background text-foreground shadow-xs hover:(bg-input text-input-foreground)',
        ghost: 'hover:(bg-accent/50 text-accent-foreground)',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'text-destructive-foreground bg-destructive hover:bg-destructive/80',
      },
      size: {
        xs: 'h-7 sm:h-6 gap-1 px-1.5 py-1 text-xs',
        sm: 'h-8 sm:h-7 gap-1.5 px-2 py-1 text-xs',
        md: 'h-9 sm:h-8 gap-1.5 px-2 py-1 text-sm',
        lg: 'h-10 sm:h-9 gap-2 px-2.5 py-1 text-base',
        xl: 'h-11 sm:h-10 gap-2 px-2.5 py-1 text-lg',
        'icon-xs': 'size-7 sm:size-6',
        'icon-sm': 'size-8 sm:size-7',
        'icon-md': 'size-9 sm:size-8',
        'icon-lg': 'size-10 sm:size-9',
        'icon-xl': 'size-11 sm:size-10',
      },
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export const buttonIconSizeVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export type ButtonIconSizeProps = VariantProps<typeof buttonIconSizeVariants>
