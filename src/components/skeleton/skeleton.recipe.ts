import { defineRecipe } from '../../theme/recipe'

import type { SkeletonStyleSlot, SkeletonStyleVariants } from './skeleton.style-types'

export const skeletonRecipe = /* @__PURE__ */ defineRecipe<
  SkeletonStyleSlot,
  SkeletonStyleVariants
>('skeleton', {
  base: {
    root: 'rounded-md bg-muted',
  },
  defaultVariants: {
    variant: 'pulse',
  },
  variants: {
    variant: {
      pulse: { root: 'animate-pulse motion-reduce:animate-none' },
      shimmer: {
        root: "bg-muted/70 relative overflow-hidden after:(pointer-events-none content-[''] inset-0 absolute animate-shimmer from-transparent to-transparent via-muted bg-gradient-to-r motion-reduce:animate-none)",
      },
    },
  },
})
