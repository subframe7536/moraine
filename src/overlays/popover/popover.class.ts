import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const popoverContentVariants = recipe({
  base: 'text-popover-foreground outline-none border border-border shadow-md rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 origin-[var(--mo-popper-content-transform-origin)] relative z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none',
  defaultVariants: {
    side: 'bottom',
  },
  variants: {
    side: {
      top: 'mb-[var(--mo-popper-content-overflow-padding)] enter-translate-y-1 exit-translate-y-1',
      right:
        'ml-[var(--mo-popper-content-overflow-padding)] -enter-translate-x-1 -exit-translate-x-1',
      bottom:
        'mt-[var(--mo-popper-content-overflow-padding)] -enter-translate-y-1 -exit-translate-y-1',
      left: 'mr-[var(--mo-popper-content-overflow-padding)] enter-translate-x-1 exit-translate-x-1',
    },
  },
})

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
