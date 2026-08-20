import type { VariantProps } from 'cls-variant'

import { TEXT_SIZE_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

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
  'text-sm text-muted-foreground font-medium flex transition-[width,height] duration-200 tabular-nums',
  {
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
    variants: {
      orientation: {
        horizontal: 'flex-row min-w-fit items-center justify-end',
        vertical: 'flex-col min-h-fit justify-end',
      },
      size: TEXT_SIZE_VARIANT,
    },
  },
)

export const progressBaseVariants = cva(
  'rounded-full bg-muted translate-z-0 relative overflow-hidden',
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
        sm: 'var-progress-1',
        md: 'h-1.5',
        lg: 'var-progress-3',
      },
    },
  },
)

export const progressIndicatorVariants = cva(
  'will-change-transform bg-primary size-full transition-transform duration-200 ease-out inset-0 absolute data-indeterminate:(opacity-100 animate-duration-2s animate-ease-in-out animate-iteration-infinite)',
  {
    defaultVariants: {
      orientation: 'horizontal',
      animation: 'carousel',
    },
    variants: {
      orientation: {
        horizontal: 'origin-left',
        vertical: 'origin-bottom',
      },
      animation: {
        carousel: '',
        reverse: '',
        swing: '',
        elastic: '',
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
        animation: 'reverse',
        class: 'data-indeterminate:animate-carousel-rtl data-indeterminate:rtl:animate-carousel',
      },
      {
        orientation: 'vertical',
        animation: 'reverse',
        class:
          'data-indeterminate:animate-carousel-vertical data-indeterminate:animate-direction-reverse',
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
  },
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'ms-2 h-full items-start',
    },
    size: TEXT_SIZE_VARIANT,
  },
})

export const progressStepVariants = cva(
  'text-end col-start-1 row-start-1 truncate transition-opacity duration-200',
  {
    defaultVariants: {
      state: 'other',
      size: 'md',
    },
    variants: {
      state: {
        active: 'opacity-100',
        first: 'text-muted-foreground opacity-100',
        other: 'opacity-0',
        last: 'opacity-100',
      },
      size: TEXT_SIZE_VARIANT,
    },
  },
)

export type ProgressVariantProps = VariantProps<typeof progressStatusVariants> &
  VariantProps<typeof progressIndicatorVariants>
