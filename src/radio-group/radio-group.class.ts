import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const radioGroupRootVariants = cva('relative')

export const radioGroupFieldsetVariants = cva('flex gap-x-2', {
  defaultVariants: {
    orientation: 'vertical',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    size: {
      xs: 'gap-y-0.5',
      sm: 'gap-y-0.5',
      md: 'gap-y-1',
      lg: 'gap-y-1',
      xl: 'gap-y-1.5',
    },
  },
})

export const radioGroupLegendVariants = cva('mb-1 block font-medium text-foreground', {
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
    variant: 'list',
    indicator: 'start',
    orientation: 'vertical',
    color: 'primary',
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
      list: '',
      card: 'rounded-lg border',
      table: 'border',
    },
    indicator: {
      start: 'flex-row',
      end: 'flex-row-reverse',
      hidden: '',
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
    color: {
      primary: '',
      secondary: '',
      neutral: '',
      error: '',
    },
    disabled: {
      true: 'opacity-75 cursor-not-allowed',
    },
  },
  compoundVariants: [
    { variant: ['card', 'table'], size: 'xs', class: 'p-2.5' },
    { variant: ['card', 'table'], size: 'sm', class: 'p-3' },
    { variant: ['card', 'table'], size: 'md', class: 'p-3.5' },
    { variant: ['card', 'table'], size: 'lg', class: 'p-4' },
    { variant: ['card', 'table'], size: 'xl', class: 'p-4.5' },
    {
      orientation: 'horizontal',
      variant: 'table',
      class: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg -ms-px first:ms-0',
    },
    {
      orientation: 'vertical',
      variant: 'table',
      class: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg -mt-px first:mt-0',
    },
    { color: 'primary', variant: 'card', class: 'data-[checked]:(border-primary)' },
    { color: 'secondary', variant: 'card', class: 'data-[checked]:(border-secondary)' },
    { color: 'error', variant: 'card', class: 'data-[checked]:(border-destructive)' },
    { color: 'neutral', variant: 'card', class: 'data-[checked]:(border-foreground)' },
    {
      color: 'primary',
      variant: 'table',
      class: 'data-[checked]:(bg-primary/10 border-primary/50 z-1)',
    },
    {
      color: 'secondary',
      variant: 'table',
      class: 'data-[checked]:(bg-secondary/10 border-secondary/50 z-1)',
    },
    {
      color: 'error',
      variant: 'table',
      class: 'data-[checked]:(bg-destructive/10 border-destructive/50 z-1)',
    },
    {
      color: 'neutral',
      variant: 'table',
      class: 'data-[checked]:(bg-muted border-foreground/50 z-1)',
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
  'inline-flex items-center justify-center overflow-hidden rounded-full border border-input bg-background outline-none transition-shadow focus-visible:effect-fv',
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
      disabled: {
        true: 'cursor-not-allowed',
      },
    },
  },
)

export const radioGroupIndicatorVariants = cva(
  'flex size-full items-center justify-center rounded-full',
  {
    defaultVariants: {
      color: 'primary',
    },
    variants: {
      color: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        neutral: 'bg-neutral',
        error: 'bg-destructive',
      },
    },
  },
)

export const radioGroupDotVariants = cva('rounded-full bg-primary-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-1',
      sm: 'size-1',
      md: 'size-1.5',
      lg: 'size-1.5',
      xl: 'size-2',
    },
  },
})

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

export const radioGroupLabelVariants = cva('block font-medium text-foreground', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export const radioGroupDescriptionVariants = cva('text-muted-foreground', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed',
    },
  },
})

export type RadioGroupVariantProps = VariantProps<typeof radioGroupFieldsetVariants> &
  VariantProps<typeof radioGroupLegendVariants> &
  VariantProps<typeof radioGroupItemVariants> &
  VariantProps<typeof radioGroupIndicatorVariants>
