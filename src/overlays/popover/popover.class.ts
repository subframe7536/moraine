import { slotRecipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { PopoverT } from './popover.types.ts'

export const popoverRecipeOptions = {
  base: {
    content: /* @__PURE__ */ cn(
      'text-popover-foreground outline-none border border-border rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 shadow-md origin-[var(--mo-popper-content-transform-origin)] relative z-floating data-closed:animate-mo-exit data-expanded:animate-mo-enter motion-reduce:animate-none data-closed:exit-opacity-0 data-expanded:enter-opacity-0 data-closed:exit-scale-95 data-expanded:enter-scale-95',
      'data-[side=bottom]:mt-[var(--mo-popper-content-overflow-padding)] data-[side=left]:mr-[var(--mo-popper-content-overflow-padding)] data-[side=right]:ml-[var(--mo-popper-content-overflow-padding)] data-[side=top]:mb-[var(--mo-popper-content-overflow-padding)] data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1',
    ),
    body: 'max-h-[var(--mo-popper-content-available-height)] overflow-auto',
  },
  defaults: {},
  variants: {},
} as const satisfies SlotRecipeOptions<keyof PopoverT.Slot>

export const popoverRecipe = /* @__PURE__ */ slotRecipe(popoverRecipeOptions)
