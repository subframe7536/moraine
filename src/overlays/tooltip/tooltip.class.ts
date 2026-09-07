import { POPPER_CONTENT_SIDE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'

import type { TooltipT } from './tooltip.types.ts'

export const tooltipRecipeOptions = {
  base: {
    content:
      'text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-[var(--mo-popper-content-transform-origin)] items-center z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none data-instant-motion:data-expanded:animate-none data-instant-motion:data-closed:animate-none',
    positioner: 'has-[[data-instant-motion]]:data-positioned:transition-transform',
    text: 'leading-4 text-pretty',
    kbds: 'rounded-sm relative z-floating isolate',
  },
  defaultVariants: {
    side: 'top',
    invert: false,
  },
  variants: {
    side: {
      top: { content: POPPER_CONTENT_SIDE_VARIANT.top },
      right: { content: POPPER_CONTENT_SIDE_VARIANT.right },
      bottom: { content: POPPER_CONTENT_SIDE_VARIANT.bottom },
      left: { content: POPPER_CONTENT_SIDE_VARIANT.left },
    },
    invert: {
      true: { content: 'text-background bg-foreground' },
      false: { content: 'text-foreground border border-border bg-background shadow-sm' },
    },
  },
} as const satisfies SlotRecipeOptions<keyof TooltipT.Slot>
