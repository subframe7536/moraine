import { POPPER_CONTENT_SIDE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'

import type { PopoverT } from './popover.types.ts'

export const popoverRecipeOptions = {
  base: {
    content:
      'text-popover-foreground outline-none border border-border shadow-md rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 origin-[var(--mo-popper-content-transform-origin)] relative z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none',
    body: 'max-h-[var(--mo-popper-content-available-height)] overflow-auto',
  },
  defaultVariants: {
    side: 'bottom',
  },
  variants: {
    side: {
      top: { content: POPPER_CONTENT_SIDE_VARIANT.top },
      right: { content: POPPER_CONTENT_SIDE_VARIANT.right },
      bottom: { content: POPPER_CONTENT_SIDE_VARIANT.bottom },
      left: { content: POPPER_CONTENT_SIDE_VARIANT.left },
    },
  },
} as const satisfies SlotRecipeOptions<keyof PopoverT.Slot>
