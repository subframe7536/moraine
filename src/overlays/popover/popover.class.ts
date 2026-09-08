import { slotRecipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'

import type { PopoverT } from './popover.types.ts'

export const popoverRecipeOptions = {
  base: {
    content:
      'text-popover-foreground outline-none border border-border rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 shadow-md origin-[var(--mo-popper-content-transform-origin)] relative z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=bottom]:(mt-[var(--mo-popper-content-overflow-padding)] -enter-translate-y-1 -exit-translate-y-1) data-[side=left]:(mr-[var(--mo-popper-content-overflow-padding)] enter-translate-x-1 exit-translate-x-1) data-[side=right]:(ml-[var(--mo-popper-content-overflow-padding)] -enter-translate-x-1 -exit-translate-x-1) data-[side=top]:(mb-[var(--mo-popper-content-overflow-padding)] enter-translate-y-1 exit-translate-y-1)',
    body: 'max-h-[var(--mo-popper-content-available-height)] overflow-auto',
  },
  defaults: {},
  variants: {},
} as const satisfies SlotRecipeOptions<keyof PopoverT.Slot>

export const popoverRecipe = /* @__PURE__ */ slotRecipe(popoverRecipeOptions)
