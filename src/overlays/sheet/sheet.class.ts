import { slotRecipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'
import { MODAL_OVERLAY_CLASS } from '../modal/modal.class.ts'

import type { SheetT } from './sheet.types.ts'

export const sheetRecipeOptions = {
  base: {
    content: /* @__PURE__ */ cn(
      'text-sm text-popover-foreground outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-lg fixed z-floating bg-clip-padding data-[transition=false]:transition-none data-closed:animate-mo-exit data-expanded:animate-mo-enter data-[transition=false]:animate-none motion-reduce:animate-none data-closed:exit-opacity-0 data-expanded:enter-opacity-0',
      'data-[side=bottom]:border-t data-[side=left]:border-r data-[side=right]:border-l data-[side=top]:border-b data-[side=bottom]:border-border data-[side=left]:border-border data-[side=right]:border-border data-[side=top]:border-border data-[side=bottom]:h-auto data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=top]:h-auto data-[side=bottom]:inset-x-0 data-[side=left]:inset-y-0 data-[side=right]:inset-y-0 data-[side=top]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=left]:left-0 data-[side=right]:right-0 data-[side=top]:top-0 data-[side=bottom]:enter-translate-y-10 data-[side=bottom]:exit-translate-y-10 data-[side=right]:enter-translate-x-10 data-[side=right]:exit-translate-x-10 data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-[side=left]:-enter-translate-x-10 data-[side=left]:-exit-translate-x-10 data-[side=top]:-enter-translate-y-10 data-[side=top]:-exit-translate-y-10',
    ),
    overlay: MODAL_OVERLAY_CLASS,
    header: 'p-4 flex gap-1.5 items-start',
    wrapper: 'flex-1 gap-0.5 grid min-w-0',
    title: 'text-foreground font-medium',
    description: 'text-sm text-muted-foreground',
    actions: 'ms-auto inline-flex shrink-0 gap-2 items-center',
    close:
      'absolute top-4 right-4 inline-flex items-center justify-center size-8 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    body: 'flex-1 overflow-auto data-header:px-4 data-header:pb-4 data-header:pt-0',
    footer: 'mt-auto p-4 flex flex-col gap-2',
  },
  defaults: {
    inset: false,
  },
  variants: {
    inset: {
      true: { content: 'sm:m-4 sm:border sm:border-border sm:rounded-2xl' },
      false: { content: 'rounded-none' },
    },
  },
} as const satisfies SlotRecipeOptions<keyof SheetT.Slot>

export const sheetRecipe = /* @__PURE__ */ slotRecipe(sheetRecipeOptions)
