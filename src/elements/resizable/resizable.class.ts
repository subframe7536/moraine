import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { ResizableT } from './resizable.types.ts'

export const resizableRecipeOptions = {
  base: {
    root: 'flex h-full min-h-0 min-w-0 w-full',
    panel:
      'min-h-0 min-w-0 overflow-auto data-transitioning:transition-flex-grow motion-reduce:transition-none duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    divider:
      "bg-border flex shrink-0 select-none items-center justify-center relative overflow-visible touch-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-default data-cross:cursor-move after:content-[''] after:absolute",
    handle:
      'data-collapse:active:cursor-pointer data-collapse:hover:cursor-pointer rounded-lg flex cursor-inherit items-center justify-center z-sticky focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 touch-none select-none bg-border shrink-0',
    crossTarget: 'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-base',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row',
        divider:
          'w-px cursor-ew-resize after:w-1.5 after:inset-y-0 after:left-1/2 after:-translate-x-1/2',
        handle: 'h-6 w-1',
        crossTarget:
          'left-1/2 -translate-x-1/2 data-resizable-handle-start-target:top-0 data-resizable-handle-end-target:bottom-0',
      },
      vertical: {
        root: 'flex-col',
        divider:
          'h-px w-full cursor-ns-resize after:h-1.5 after:inset-x-0 after:top-1/2 after:-translate-y-1/2',
        handle: 'h-1 w-6',
        crossTarget:
          'top-1/2 -translate-y-1/2 data-resizable-handle-start-target:left-0 data-resizable-handle-end-target:right-0',
      },
    },
  },
} as const satisfies SlotRecipeOptions<keyof ResizableT.Slot>

export const resizableRecipe = recipe(resizableRecipeOptions)

export type ResizableVariantProps = ResizableT.Variant
