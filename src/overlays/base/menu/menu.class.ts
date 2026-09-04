import type { VariantProps } from '../../../shared/style/recipe.ts'
import { recipe } from '../../../shared/style/recipe.ts'

export const overlayMenuItemVariants = recipe({
  base: 'text-sm px-2 py-1.5 outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-disabled:opacity-50 data-disabled:pointer-events-none',
  defaultVariants: {
    color: 'default',
    size: 'md',
  },
  variants: {
    color: {
      default: 'text-foreground data-highlighted:bg-muted',
      destructive: 'text-destructive data-highlighted:bg-destructive/15',
    },
    size: {
      sm: 'text-xs min-h-7',
      md: 'text-sm min-h-8',
      lg: 'min-h-9',
    },
  },
})

export type OverlayMenuItemVariantProps = VariantProps<typeof overlayMenuItemVariants>

export const overlayMenuContentVariants = recipe({
  base: 'text-popover-foreground p-1 outline-none border border-border rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-[var(--mo-popper-content-transform-origin)] z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none',
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
