import { defineRecipe } from '../../theme/recipe'

import type { EmptyStyleSlot, EmptyStyleVariant } from './empty.style-types'

export const emptyRecipe = /* @__PURE__ */ defineRecipe<EmptyStyleSlot, EmptyStyleVariant>(
  'empty',
  {
    base: {
      root: 'text-center flex flex-col min-w-0 w-full items-center justify-center',
      media: 'flex max-w-full items-center justify-center',
      title: 'text-foreground leading-snug font-medium',
      description: 'text-muted-foreground leading-relaxed max-w-sm',
      actions: 'flex flex-wrap max-w-full items-center justify-center',
    },
    defaultVariants: { size: 'md' },
    variants: {
      size: {
        sm: {
          root: 'px-4 py-6 gap-1.5',
          media: 'not-last:mb-1.5',
          title: 'text-sm',
          description: 'text-xs',
          actions: 'gap-2 not-first:mt-1.5',
        },
        md: {
          root: 'px-6 py-8 gap-2',
          media: 'not-last:mb-2',
          title: 'text-base',
          description: 'text-sm',
          actions: 'gap-3 not-first:mt-2',
        },
        lg: {
          root: 'px-8 py-12 gap-2.5',
          media: 'not-last:mb-2.5',
          title: 'text-lg',
          description: 'text-base',
          actions: 'gap-4 not-first:mt-2.5',
        },
      },
    },
  },
)
