import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const popoverContentVariants = recipe({
  base: 'text-popover-foreground outline-none border border-border shadow-md rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 origin-[var(--mo-popper-content-transform-origin)] relative z-floating data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95] data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95] motion-reduce:animate-none',
  defaultVariants: {
    side: 'bottom',
  },
  variants: {
    side: {
      top: 'mb-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]',
      right:
        'ml-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]',
      bottom:
        'mt-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]',
      left: 'mr-[var(--mo-popper-content-overflow-padding)] [--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]',
    },
  },
})

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
