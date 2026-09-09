import { slotRecipe } from '../../shared/style/recipe.ts'

import type { TooltipT } from './tooltip.types.ts'

export const tooltipRecipe = /* @__PURE__ */ slotRecipe<keyof TooltipT.Slot>({
  base: {
    content:
      'data-instant-motion:data-expanded:animate-none data-instant-motion:data-closed:animate-none text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-(--mo-popper-content-transform-origin) items-center z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=bottom]:(mt-(--mo-popper-content-overflow-padding) -enter-translate-y-1 -exit-translate-y-1) data-[side=left]:(mr-(--mo-popper-content-overflow-padding) enter-translate-x-1 exit-translate-x-1) data-[side=right]:(ml-(--mo-popper-content-overflow-padding) -enter-translate-x-1 -exit-translate-x-1) data-[side=top]:(mb-(--mo-popper-content-overflow-padding) enter-translate-y-1 exit-translate-y-1)',
    positioner: 'has-[[data-instant-motion]]:data-positioned:transition-transform',
    text: 'leading-4 text-pretty',
    kbds: 'rounded-sm relative z-floating isolate',
  },
  defaults: {
    invert: false,
  },
  variants: {
    invert: {
      true: { content: 'text-background bg-foreground' },
      false: { content: 'text-foreground border border-border bg-background shadow-sm' },
    },
  },
})
