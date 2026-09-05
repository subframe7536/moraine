import { POPPER_CONTENT_SIDE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const tooltipContentVariants = recipe({
  base: 'text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-[var(--mo-popper-content-transform-origin)] items-center z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none',
  defaultVariants: {
    side: 'top',
    invert: false,
  },
  variants: {
    side: POPPER_CONTENT_SIDE_VARIANT,
    invert: {
      true: 'text-background bg-foreground',
      false: 'text-foreground border border-border bg-background shadow-sm',
    },
  },
})

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
