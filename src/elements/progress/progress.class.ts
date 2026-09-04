import { defineStyleVars } from '../../shared/style/css-vars.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const progressStyleVars = defineStyleVars({
  prefix: 'p',
  variants: {
    size: {
      sm: { size: '0.25rem' },
      md: { size: '0.5rem' },
      lg: { size: '0.75rem' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const progressRecipe = recipe({
  slots: ['root', 'status', 'track', 'indicator', 'steps', 'step'],
  base: {
    root: 'gap-2 relative',
    status: 'text-sm text-muted-foreground font-medium flex transition-[width,height] tabular-nums',
    track: 'rounded-full bg-muted translate-z-0 relative overflow-hidden',
    indicator:
      'will-change-transform bg-primary size-full transition-transform inset-0 absolute data-indeterminate:opacity-100',
    steps: 'grid items-end',
    step: 'text-end col-start-1 row-start-1 truncate transition-opacity',
  },
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
    animation: 'carousel',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex flex-col w-full',
        status: 'flex-row min-w-fit items-center justify-end',
        track: 'h-[var(--p-size)] w-full',
        indicator: 'origin-left',
        steps: 'w-full',
      },
      vertical: {
        root: 'flex flex-row-reverse h-full min-h-36 items-start',
        status: 'flex-col min-h-fit justify-end',
        track: 'h-full min-h-36 w-[var(--p-size)]',
        indicator: 'origin-bottom',
        steps: 'ms-2 h-full items-start',
      },
    },
    size: {
      sm: {
        status: 'text-xs',
        steps: 'text-xs',
        step: 'text-xs',
      },
      md: {
        status: 'text-sm',
        steps: 'text-sm',
        step: 'text-sm',
      },
      lg: {
        status: 'text-base',
        steps: 'text-base',
        step: 'text-base',
      },
    },
    animation: {
      carousel: {},
      reverse: {},
      swing: {},
      elastic: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        orientation: 'horizontal',
        animation: 'carousel',
      },
      class: {
        indicator:
          'data-indeterminate:animate-carousel data-indeterminate:rtl:animate-carousel-rtl',
      },
    },
    {
      variants: {
        orientation: 'vertical',
        animation: 'carousel',
      },
      class: {
        indicator: 'data-indeterminate:animate-carousel-vertical',
      },
    },
    {
      variants: {
        orientation: 'horizontal',
        animation: 'reverse',
      },
      class: {
        indicator:
          'data-indeterminate:animate-carousel-rtl data-indeterminate:rtl:animate-carousel',
      },
    },
    {
      variants: {
        orientation: 'vertical',
        animation: 'reverse',
      },
      class: {
        indicator:
          'data-indeterminate:animate-carousel-vertical data-indeterminate:animate-direction-reverse',
      },
    },
    {
      variants: {
        orientation: 'horizontal',
        animation: 'swing',
      },
      class: {
        indicator: 'data-indeterminate:animate-swing',
      },
    },
    {
      variants: {
        orientation: 'vertical',
        animation: 'swing',
      },
      class: {
        indicator: 'data-indeterminate:animate-swing-vertical',
      },
    },
    {
      variants: {
        orientation: 'horizontal',
        animation: 'elastic',
      },
      class: {
        indicator: 'data-indeterminate:animate-elastic',
      },
    },
    {
      variants: {
        orientation: 'vertical',
        animation: 'elastic',
      },
      class: {
        indicator: 'data-indeterminate:animate-elastic-vertical',
      },
    },
  ],
})

export const progressStepVariants = recipe({
  base: 'text-end col-start-1 row-start-1 truncate transition-opacity',
  defaultVariants: { state: 'other', size: 'md' },
  variants: {
    state: {
      active: 'opacity-100',
      first: 'text-muted-foreground opacity-100',
      other: 'opacity-0',
      last: 'opacity-100',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
})

export type ProgressVariantProps = VariantProps<typeof progressRecipe>
