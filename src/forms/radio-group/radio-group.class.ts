import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

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

export const radioGroupLegendVariants = cva('mb-2 block font-medium text-foreground', {
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
      true: "after:(ms-0.5 text-destructive content-['*'])",
    },
  },
})

export const radioGroupItemVariants = cva('flex items-start', {
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
      card: 'rounded-lg border data-checked:border-primary',
      table: 'relative border border-muted data-checked:(bg-primary/10 border-primary/50 z-1)',
    },
    indicator: {
      start: 'flex-row',
      end: 'flex-row-reverse',
    },
    tableOrientation: {
      horizontal: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg not-first-of-type:-ms-px',
      vertical: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg not-first-of-type:-mt-px',
    },
    disabled: {
      true: 'effect-dis',
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
  'inline-flex items-center justify-center overflow-hidden rounded-full border border-input bg-background bg-clip-padding outline-none transition-shadow dark:bg-input/30 peer-focus-visible:effect-fv-border',
  {
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
      invalid: {
        true: 'effect-invalid',
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
