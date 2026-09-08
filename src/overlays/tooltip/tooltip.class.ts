import { slotRecipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { TooltipT } from './tooltip.types.ts'

export const tooltipRecipeOptions = {
  base: {
    content: /* @__PURE__ */ cn(
      'data-instant-motion:data-expanded:animate-none data-instant-motion:data-closed:animate-none text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-[var(--mo-popper-content-transform-origin)] items-center z-floating data-closed:animate-mo-exit data-expanded:animate-mo-enter motion-reduce:animate-none data-closed:exit-opacity-0 data-expanded:enter-opacity-0 data-closed:exit-scale-95 data-expanded:enter-scale-95',
      'data-[side=bottom]:mt-[var(--mo-popper-content-overflow-padding)] data-[side=left]:mr-[var(--mo-popper-content-overflow-padding)] data-[side=right]:ml-[var(--mo-popper-content-overflow-padding)] data-[side=top]:mb-[var(--mo-popper-content-overflow-padding)] data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1',
    ),
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
} as const satisfies SlotRecipeOptions<keyof TooltipT.Slot>

export const tooltipRecipe = /* @__PURE__ */ slotRecipe(tooltipRecipeOptions)
