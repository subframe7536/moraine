import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const radioGroupFieldsetVariants = cva('flex', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
})

export const radioGroupLegendVariants = cva('text-foreground font-medium mb-2 block', {
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
    required: {
      true: "after:(text-destructive ms-0.5 content-['*'])",
    },
  },
})

export const radioGroupItemVariants = cva('flex items-start data-disabled:effect-dis', {
  defaultVariants: {
    size: 'md',
    indicator: 'start',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
    variant: {
      card: 'b-(1 border) rounded-lg data-checked:border-primary',
      table: 'b-(1 muted) relative data-checked:(border-primary/50 bg-primary/10 z-1)',
    },
    indicator: {
      start: 'flex-row',
      end: 'flex-row-reverse',
    },
    tableOrientation: {
      horizontal: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg not-first-of-type:-ms-px',
      vertical: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg not-first-of-type:-mt-px',
    },
  },
  compoundVariants: [
    {
      variant: 'card',
      size: 'xs',
      class: 'p-2.5',
    },
    {
      variant: 'card',
      size: 'sm',
      class: 'p-3',
    },
    {
      variant: 'card',
      size: 'md',
      class: 'p-3.5',
    },
    {
      variant: 'card',
      size: 'lg',
      class: 'p-4',
    },
    {
      variant: 'card',
      size: 'xl',
      class: 'p-4.5',
    },
    {
      variant: 'table',
      size: 'xs',
      class: 'p-2.5',
    },
    {
      variant: 'table',
      size: 'sm',
      class: 'p-3',
    },
    {
      variant: 'table',
      size: 'md',
      class: 'p-3.5',
    },
    {
      variant: 'table',
      size: 'lg',
      class: 'p-4',
    },
    {
      variant: 'table',
      size: 'xl',
      class: 'p-4.5',
    },
  ],
})

export const radioGroupContainerVariants = cva('flex items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'h-4',
      sm: 'h-4',
      md: 'h-5',
      lg: 'h-5',
      xl: 'h-6',
    },
  },
})

export const radioGroupBaseVariants = cva(
  'outline-none b-(1 input) rounded-full bg-background inline-flex transition-shadow items-center justify-center overflow-hidden bg-clip-padding peer-focus-visible:effect-fv-border data-invalid:effect-invalid dark:bg-input/30',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
    },
  },
)

export const radioGroupWrapperVariants = cva('w-full', {
  defaultVariants: {
    indicator: 'start',
  },
  variants: {
    indicator: {
      start: 'ms-2',
      end: 'me-2',
      hidden: 'text-center',
    },
  },
})

type RadioGroupItemVariant = 'list' | 'card' | 'table'
type RadioGroupItemIndicator = 'start' | 'end' | 'hidden'
type RadioGroupItemVariantProps = Omit<
  VariantProps<typeof radioGroupItemVariants>,
  'variant' | 'indicator' | 'tableOrientation'
>

export type RadioGroupVariantProps = VariantProps<typeof radioGroupFieldsetVariants> &
  VariantProps<typeof radioGroupLegendVariants> &
  RadioGroupItemVariantProps & {
    variant?: RadioGroupItemVariant
    indicator?: RadioGroupItemIndicator
  }
