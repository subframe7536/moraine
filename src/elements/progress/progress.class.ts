import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const progressRootVariants = cva('gap-2 relative', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'flex flex-col w-full',
      vertical: 'flex flex-row-reverse h-full min-h-36 items-start',
    },
  },
})

export const progressStatusVariants = cva(
  'text-muted-foreground flex transition-[width,height] duration-200',
  {
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
      color: 'primary',
    },
    variants: {
      orientation: {
        horizontal: 'flex-row min-w-fit items-center justify-end',
        vertical: 'flex-col min-h-fit justify-end',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base',
      },
      color: {
        primary: 'text-primary',
        secondary: 'text-secondary',
        neutral: 'text-muted-foreground',
        error: 'text-destructive',
      },
    },
  },
)

export const progressBaseVariants = cva(
  'rounded-full bg-input translate-z-0 relative overflow-hidden',
  {
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
    variants: {
      orientation: {
        horizontal: 'h-$p-size w-full',
        vertical: 'h-full min-h-36 w-$p-size',
      },
      size: {
        xs: 'var-progress-0.5',
        sm: 'var-progress-1',
        md: 'var-progress-2',
        lg: 'var-progress-3',
        xl: 'var-progress-4',
      },
    },
  },
)

export const progressIndicatorVariants = cva(
  'will-change-transform rounded-full size-full transition-transform duration-200 ease-out inset-0 absolute data-indeterminate:animate-(duration-2s ease-in-out iteration-infinite)',
  {
    defaultVariants: {
      color: 'primary',
      orientation: 'horizontal',
      animation: 'carousel',
    },
    variants: {
      color: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        neutral: 'bg-inverted',
        error: 'bg-destructive',
      },
      orientation: {
        horizontal: 'origin-left',
        vertical: 'origin-bottom',
      },
      animation: {
        carousel: 'data-indeterminate:opacity-100',
        'carousel-inverse': 'data-indeterminate:opacity-100',
        swing: 'data-indeterminate:opacity-100',
        elastic: 'data-indeterminate:opacity-100',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        animation: 'carousel',
        class: 'data-indeterminate:animate-carousel data-indeterminate:rtl:animate-carousel-rtl',
      },
      {
        orientation: 'vertical',
        animation: 'carousel',
        class: 'data-indeterminate:animate-carousel-vertical',
      },
      {
        orientation: 'horizontal',
        animation: 'carousel-inverse',
        class:
          'data-indeterminate:animate-carousel-inverse data-indeterminate:rtl:animate-carousel-inverse-rtl',
      },
      {
        orientation: 'vertical',
        animation: 'carousel-inverse',
        class: 'data-indeterminate:animate-carousel-inverse-vertical',
      },
      {
        orientation: 'horizontal',
        animation: 'swing',
        class: 'data-indeterminate:animate-swing',
      },
      {
        orientation: 'vertical',
        animation: 'swing',
        class: 'data-indeterminate:animate-swing-vertical',
      },
      {
        orientation: 'horizontal',
        animation: 'elastic',
        class: 'data-indeterminate:animate-elastic',
      },
      {
        orientation: 'vertical',
        animation: 'elastic',
        class: 'data-indeterminate:animate-elastic-vertical',
      },
    ],
  },
)

export const progressStepsVariants = cva('grid items-end', {
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
    color: 'primary',
  },
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'ms-2 h-full items-start',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
    color: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      neutral: 'text-foreground',
      error: 'text-destructive',
    },
  },
})

export const progressStepVariants = cva(
  'text-end col-start-1 row-start-1 truncate transition-opacity duration-200',
  {
    defaultVariants: {
      state: 'other',
      size: 'md',
      color: 'primary',
    },
    variants: {
      state: {
        active: 'opacity-100',
        first: 'text-muted-foreground opacity-100',
        other: 'opacity-0',
        last: 'opacity-100',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base',
      },
      color: {
        primary: 'text-primary',
        secondary: 'text-secondary',
        neutral: 'text-foreground',
        error: 'text-destructive',
      },
    },
  },
)

export type ProgressVariantProps = VariantProps<typeof progressRootVariants> &
  VariantProps<typeof progressStatusVariants> &
  VariantProps<typeof progressBaseVariants> &
  VariantProps<typeof progressIndicatorVariants> &
  VariantProps<typeof progressStepsVariants> &
  VariantProps<typeof progressStepVariants>
