import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const tooltipContentVariants = recipe({
  base: 'text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-[var(--mo-popper-content-transform-origin)] items-center z-floating data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95] data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95] motion-reduce:animate-none',
  defaultVariants: {
    side: 'top',
    invert: false,
  },
  variants: {
    side: {
      left: 'mr-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]',
      right:
        'ml-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]',
      top: 'mb-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]',
      bottom:
        'mt-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]',
    },
    invert: {
      true: 'text-background bg-foreground',
      false: 'text-foreground border border-border bg-background shadow-sm',
    },
  },
})

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
