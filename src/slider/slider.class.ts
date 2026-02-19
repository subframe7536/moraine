import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const sliderRootVariants = cva('relative flex touch-none select-none', {
  defaultVariants: {
    color: 'primary',
    size: 'md',
    orientation: 'horizontal',
    disabled: false,
    highlight: false,
  },
  variants: {
    color: {
      primary: '',
      secondary: '',
      neutral: '',
      error: '',
    },
    size: {
      xs: 'gap-2',
      sm: 'gap-2',
      md: 'gap-2.5',
      lg: 'gap-3',
      xl: 'gap-3.5',
    },
    orientation: {
      horizontal: 'w-full items-center',
      vertical: 'h-full min-h-44 flex-col items-center',
    },
    highlight: {
      true: 'rounded-md ring-1 ring-inset ring-border/70',
    },
    disabled: {
      true: 'pointer-events-none opacity-64',
    },
  },
})

export const sliderTrackVariants = cva(
  'relative grow select-none before:(absolute rounded-full bg-input content-empty)',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      disabled: false,
      highlight: false,
    },
    variants: {
      color: {
        primary: '',
        secondary: '',
        neutral: '',
        error: '',
      },
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      orientation: {
        horizontal: 'w-full before:(inset-x-0.5 inset-y-0)',
        vertical: 'h-full before:(inset-x-0 inset-y-0.5)',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border/70',
      },
      disabled: {
        true: 'opacity-64',
      },
    },
    compoundVariants: [
      { orientation: 'horizontal', size: 'xs', class: 'h-[3px]' },
      { orientation: 'horizontal', size: 'sm', class: 'h-[4px]' },
      { orientation: 'horizontal', size: 'md', class: 'h-1' },
      { orientation: 'horizontal', size: 'lg', class: 'h-[5px]' },
      { orientation: 'horizontal', size: 'xl', class: 'h-[6px]' },
      { orientation: 'vertical', size: 'xs', class: 'w-[3px]' },
      { orientation: 'vertical', size: 'sm', class: 'w-[4px]' },
      { orientation: 'vertical', size: 'md', class: 'w-1' },
      { orientation: 'vertical', size: 'lg', class: 'w-[5px]' },
      { orientation: 'vertical', size: 'xl', class: 'w-[6px]' },
    ],
  },
)

export const sliderRangeVariants = cva('absolute select-none rounded-full', {
  defaultVariants: {
    color: 'primary',
    size: 'md',
    orientation: 'horizontal',
    disabled: false,
    highlight: false,
  },
  variants: {
    color: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      neutral: 'bg-inverted',
      error: 'bg-destructive',
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    orientation: {
      horizontal: 'h-full ms-0.5',
      vertical: 'w-full mb-0.5',
    },
    highlight: {
      true: 'ring-1 ring-inset ring-background/40',
    },
    disabled: {
      true: 'opacity-64',
    },
  },
})

export const sliderThumbVariants = cva(
  'relative block shrink-0 select-none rounded-full border bg-white not-dark:bg-clip-padding shadow-xs/5 outline-none transition data-[dragging]:(scale-120 shadow-none) focus-visible:ring-[3px] dark:border-background',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      disabled: false,
      highlight: false,
    },
    variants: {
      color: {
        primary: 'focus-visible:ring-primary/24 dark:focus-visible:ring-primary/48',
        secondary: 'focus-visible:ring-secondary/24 dark:focus-visible:ring-secondary/48',
        neutral: 'focus-visible:ring-ring/24 dark:focus-visible:ring-ring/48',
        error: 'focus-visible:ring-destructive/24 dark:focus-visible:ring-destructive/48',
      },
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
      orientation: {
        horizontal: '',
        vertical: '',
      },
      highlight: {
        true: 'ring-1 ring-border/50',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-64',
      },
    },
  },
)

export const sliderInputVariants = cva('', {
  defaultVariants: {
    color: 'primary',
    size: 'md',
    orientation: 'horizontal',
    disabled: false,
    highlight: false,
  },
  variants: {
    color: {
      primary: '',
      secondary: '',
      neutral: '',
      error: '',
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
    highlight: {
      true: '',
    },
    disabled: {
      true: '',
    },
  },
})

export type SliderVariantProps = VariantProps<typeof sliderRootVariants> &
  VariantProps<typeof sliderTrackVariants> &
  VariantProps<typeof sliderRangeVariants> &
  VariantProps<typeof sliderThumbVariants> &
  VariantProps<typeof sliderInputVariants>
