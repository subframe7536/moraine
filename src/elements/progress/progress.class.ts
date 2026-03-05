import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const progressRootVariants = cva('relative gap-2', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'flex w-full flex-col',
      vertical: 'flex h-full min-h-36 flex-row-reverse items-start',
    },
  },
})

export const progressStatusVariants = cva(
  'flex text-muted-foreground transition-[width,height] duration-200',
  {
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
      color: 'primary',
    },
    variants: {
      orientation: {
        horizontal: 'min-w-fit flex-row items-center justify-end',
        vertical: 'min-h-fit flex-col justify-end',
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
  'relative overflow-hidden rounded-full bg-input translate-z-0',
  {
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
    variants: {
      orientation: {
        horizontal: 'w-full h-$progress-base-size',
        vertical: 'h-full min-h-36 w-$progress-base-size',
      },
      size: {
        xs: '[--progress-base-size:calc(var(--spacing)*0.5)]',
        sm: '[--progress-base-size:var(--spacing)]',
        md: '[--progress-base-size:calc(var(--spacing)*2)]',
        lg: '[--progress-base-size:calc(var(--spacing)*3)]',
        xl: '[--progress-base-size:calc(var(--spacing)*4)]',
      },
    },
  },
)

export const progressIndicatorVariants = cva(
  'absolute inset-0 size-full rounded-full transition-transform duration-200 ease-out will-change-transform data-indeterminate:animate-(duration-2s ease-in-out iteration-infinite)',
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
        class:
          'data-indeterminate:animate-[carousel] data-indeterminate:rtl:animate-[carousel-rtl]',
      },
      {
        orientation: 'vertical',
        animation: 'carousel',
        class: 'data-indeterminate:animate-[carousel-vertical]',
      },
      {
        orientation: 'horizontal',
        animation: 'carousel-inverse',
        class:
          'data-indeterminate:animate-[carousel-inverse] data-indeterminate:rtl:animate-[carousel-inverse-rtl]',
      },
      {
        orientation: 'vertical',
        animation: 'carousel-inverse',
        class: 'data-indeterminate:animate-[carousel-inverse-vertical]',
      },
      {
        orientation: 'horizontal',
        animation: 'swing',
        class: 'data-indeterminate:animate-[swing]',
      },
      {
        orientation: 'vertical',
        animation: 'swing',
        class: 'data-indeterminate:animate-[swing-vertical]',
      },
      {
        orientation: 'horizontal',
        animation: 'elastic',
        class: 'data-indeterminate:animate-[elastic]',
      },
      {
        orientation: 'vertical',
        animation: 'elastic',
        class: 'data-indeterminate:animate-[elastic-vertical]',
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
  'row-start-1 col-start-1 truncate text-end transition-opacity duration-200',
  {
    defaultVariants: {
      state: 'other',
      size: 'md',
      color: 'primary',
    },
    variants: {
      state: {
        active: 'opacity-100',
        first: 'opacity-100 text-muted-foreground',
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
