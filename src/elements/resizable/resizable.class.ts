import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { ResizableT } from './resizable.types.ts'

export const resizableRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'flex h-full min-h-0 min-w-0 w-full',
      'data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
    ),
    panel:
      'min-h-0 min-w-0 overflow-auto data-transitioning:transition-flex-grow motion-reduce:transition-none duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    divider: /* @__PURE__ */ cn(
      "bg-border flex shrink-0 select-none items-center justify-center relative overflow-visible touch-none focus-visible:outline-none aria-disabled:cursor-default data-cross:cursor-move after:content-[''] focus-visible:ring-3 focus-visible:ring-ring/50 after:absolute",
      'data-[orientation=horizontal]:w-px data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=horizontal]:cursor-ew-resize data-[orientation=vertical]:cursor-ns-resize data-[orientation=horizontal]:after:w-1.5 data-[orientation=vertical]:after:h-1.5 data-[orientation=horizontal]:after:inset-y-0 data-[orientation=vertical]:after:inset-x-0 data-[orientation=horizontal]:after:left-1/2 data-[orientation=vertical]:after:top-1/2 data-[orientation=horizontal]:after:-translate-x-1/2 data-[orientation=vertical]:after:-translate-y-1/2',
    ),
    handle: /* @__PURE__ */ cn(
      'rounded-lg bg-border flex shrink-0 cursor-inherit select-none items-center justify-center z-sticky touch-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-collapse:active:cursor-pointer data-collapse:hover:cursor-pointer',
      'data-[orientation=horizontal]:h-6 data-[orientation=horizontal]:w-1 data-[orientation=vertical]:h-1 data-[orientation=vertical]:w-6',
    ),
    crossTarget: /* @__PURE__ */ cn(
      'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-base',
      'data-[orientation=horizontal]:data-resizable-handle-start-target:top-0 data-[orientation=horizontal]:data-resizable-handle-end-target:bottom-0 data-[orientation=vertical]:data-resizable-handle-start-target:left-0 data-[orientation=vertical]:data-resizable-handle-end-target:right-0 data-[orientation=horizontal]:left-1/2 data-[orientation=vertical]:top-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=vertical]:-translate-y-1/2',
    ),
  },
  defaults: {},
  variants: {},
} as const satisfies SlotRecipeOptions<keyof ResizableT.Slot>

export const resizableRecipe = /* @__PURE__ */ slotRecipe(resizableRecipeOptions)
