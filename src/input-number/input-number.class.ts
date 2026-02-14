import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const inputNumberRootVariants = cva('relative inline-flex w-full items-center')

export const inputNumberBaseVariants = cva(
  'w-full rounded-md border border-input bg-background text-foreground outline-none transition-shadow placeholder:text-muted-foreground disabled:(cursor-not-allowed opacity-75)',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'outline',
      orientation: 'horizontal',
      increment: true,
      decrement: true,
    },
    variants: {
      color: {
        primary: 'focus-visible:(ring-2 ring-inset ring-primary)',
        secondary: 'focus-visible:(ring-2 ring-inset ring-secondary)',
        neutral: 'focus-visible:(ring-2 ring-inset ring-neutral)',
        error: 'focus-visible:(ring-2 ring-inset ring-destructive)',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-2.5 text-sm',
        lg: 'h-10 px-3 text-sm',
        xl: 'h-11 px-3 text-base',
      },
      variant: {
        outline: 'border border-input bg-background',
        soft: 'border-transparent bg-muted/50 hover:bg-muted',
        subtle: 'border border-border bg-muted',
        ghost: 'border-transparent bg-transparent hover:bg-muted',
        none: 'border-transparent bg-transparent',
      },
      orientation: {
        horizontal: 'text-center',
        vertical: 'text-center pe-9',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      increment: {
        true: '',
        false: '',
      },
      decrement: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: 'true', class: 'ring-primary' },
      { color: 'secondary', highlight: 'true', class: 'ring-secondary' },
      { color: 'neutral', highlight: 'true', class: 'ring-foreground' },
      { color: 'error', highlight: 'true', class: 'ring-destructive' },
      { orientation: 'horizontal', decrement: 'false', class: 'text-start' },
      { increment: 'true', size: 'xs', class: 'pe-7' },
      { increment: 'true', size: 'sm', class: 'pe-8' },
      { increment: 'true', size: 'md', class: 'pe-9' },
      { increment: 'true', size: 'lg', class: 'pe-10' },
      { increment: 'true', size: 'xl', class: 'pe-11' },
      { decrement: 'true', size: 'xs', class: 'ps-7' },
      { decrement: 'true', size: 'sm', class: 'ps-8' },
      { decrement: 'true', size: 'md', class: 'ps-9' },
      { decrement: 'true', size: 'lg', class: 'ps-10' },
      { decrement: 'true', size: 'xl', class: 'ps-11' },
    ],
  },
)

export const inputNumberIncrementVariants = cva('absolute flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 end-0 pe-1',
      vertical: 'top-0 end-0 pe-1',
    },
    disabled: {
      true: 'opacity-75',
    },
  },
})

export const inputNumberDecrementVariants = cva('absolute flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 start-0 ps-1',
      vertical: 'bottom-0 end-0 pe-1',
    },
    disabled: {
      true: 'opacity-75',
    },
  },
})

export type InputNumberVariantProps = VariantProps<typeof inputNumberBaseVariants> &
  VariantProps<typeof inputNumberIncrementVariants> &
  VariantProps<typeof inputNumberDecrementVariants>
