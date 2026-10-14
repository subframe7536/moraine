import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { ProgressStyleSlot, ProgressStyleVariant } from './progress.style-types'

export const progressDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('indeterminate', 'progress'),
  indicator: /* @__PURE__ */ createDataAttributes('indeterminate', 'progress'),
} satisfies DataAttributeContract<keyof ProgressStyleSlot>

export const progressRecipe = /* @__PURE__ */ defineRecipe<ProgressStyleSlot, ProgressStyleVariant>(
  'progress',
  {
    base: {
      root: 'gap-y-2 grid relative',
      label: 'text-sm font-medium min-w-0 self-center',
      value: 'text-sm text-muted-foreground font-medium self-center justify-self-end tabular-nums',
      track: 'rounded-full bg-muted translate-z-0 relative overflow-hidden',
      indicator:
        'will-change-transform bg-primary size-full transition-transform inset-0 absolute data-indeterminate:opacity-100',
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
      animation: 'carousel',
    },
    variants: {
      orientation: {
        horizontal: {
          root: 'w-full',
          track: 'h-(--p-size) w-full',
          indicator:
            'origin-left rtl:origin-right not-[[data-indeterminate]]:scale-x-[var(--p-value)]',
        },
        vertical: {
          root: 'h-full min-h-36 w-fit',
          track: 'h-full min-h-36 w-(--p-size) justify-self-center',
          indicator: 'origin-bottom not-[[data-indeterminate]]:scale-y-[var(--p-value)]',
        },
      },
      size: {
        sm: {
          '--p-size': '0.25rem',
          label: 'text-xs',
          value: 'text-xs',
        },
        md: {
          '--p-size': '0.5rem',
          label: 'text-sm',
          value: 'text-sm',
        },
        lg: {
          '--p-size': '0.75rem',
          label: 'text-base',
          value: 'text-base',
        },
      },
    },
    compoundVariants: [
      {
        variants: {
          orientation: 'horizontal',
          animation: 'carousel',
        },
        indicator:
          'data-indeterminate:animate-carousel data-indeterminate:rtl:animate-carousel-rtl',
      },
      {
        variants: {
          orientation: 'vertical',
          animation: 'carousel',
        },
        indicator: 'data-indeterminate:animate-carousel-vertical',
      },
      {
        variants: {
          orientation: 'horizontal',
          animation: 'reverse',
        },
        indicator:
          'data-indeterminate:animate-carousel-rtl data-indeterminate:rtl:animate-carousel',
      },
      {
        variants: {
          orientation: 'vertical',
          animation: 'reverse',
        },
        indicator: 'data-indeterminate:(animate-carousel-vertical [animation-direction:reverse])',
      },
      {
        variants: {
          orientation: 'horizontal',
          animation: 'swing',
        },
        indicator: 'data-indeterminate:animate-swing',
      },
      {
        variants: {
          orientation: 'vertical',
          animation: 'swing',
        },
        indicator: 'data-indeterminate:animate-swing-vertical',
      },
      {
        variants: {
          orientation: 'horizontal',
          animation: 'elastic',
        },
        indicator: 'data-indeterminate:animate-elastic',
      },
      {
        variants: {
          orientation: 'vertical',
          animation: 'elastic',
        },
        indicator: 'data-indeterminate:animate-elastic-vertical',
      },
    ],
  },
)
