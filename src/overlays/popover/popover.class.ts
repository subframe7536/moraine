import { slotRecipe } from '../../shared/style/recipe.ts'

import type { PopoverT } from './popover.types.ts'

export const popoverRecipe = /* @__PURE__ */ slotRecipe<keyof PopoverT.Slot>({
  base: {
    content:
      'text-popover-foreground outline-none border border-border rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 shadow-md origin-(--mo-popper-content-transform-origin) relative z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=bottom]:(mt-(--mo-popper-content-overflow-padding) -enter-translate-y-1 -exit-translate-y-1) data-[side=left]:(mr-(--mo-popper-content-overflow-padding) enter-translate-x-1 exit-translate-x-1) data-[side=right]:(ml-(--mo-popper-content-overflow-padding) -enter-translate-x-1 -exit-translate-x-1) data-[side=top]:(mb-(--mo-popper-content-overflow-padding) enter-translate-y-1 exit-translate-y-1)',
    body: 'max-h-(--mo-popper-content-available-height) overflow-auto',
  },
  defaults: {},
  variants: {},
})
