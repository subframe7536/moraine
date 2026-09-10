import { slotRecipe } from '../../shared/style/recipe'
import { MODAL_OVERLAY_CLASS } from '../modal/modal.class'

import type { SheetT } from './sheet.types'

export const sheetRecipe = /* @__PURE__ */ slotRecipe<SheetT.Slot, SheetT.Variant>({
  base: {
    content:
      'text-sm text-popover-foreground outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-lg fixed z-floating bg-clip-padding data-transition:data-closed:(animate-mo-exit exit-opacity-0) data-transition:data-expanded:(animate-mo-enter enter-opacity-0) data-transition:motion-reduce:animate-none',
    overlay: MODAL_OVERLAY_CLASS,
    header: 'p-4 flex gap-1.5 items-start',
    wrapper: 'flex-1 gap-0.5 grid min-w-0',
    title: 'text-foreground font-medium',
    description: 'text-sm text-muted-foreground',
    actions: 'ms-auto inline-flex shrink-0 gap-2 items-center',
    close:
      'absolute top-4 right-4 inline-flex items-center justify-center size-8 rounded-md hover:bg-accent focus-visible:(outline-none ring-2 ring-ring) disabled:(pointer-events-none opacity-50)',
    body: 'flex-1 overflow-auto data-header:(px-4 pb-4 pt-0)',
    footer: 'mt-auto p-4 flex flex-col gap-2',
  },
  defaults: {
    inset: false,
    side: 'right',
  },
  variants: {
    inset: {
      true: { content: 'sm:(m-4 border border-border rounded-2xl)' },
      false: { content: 'rounded-none' },
    },
    side: {
      bottom: {
        content:
          'border-t border-border h-auto inset-x-0 bottom-0 enter-translate-y-10 exit-translate-y-10',
      },
      left: {
        content:
          'border-r border-border h-full w-3/4 inset-y-0 left-0 sm:max-w-sm -enter-translate-x-10 -exit-translate-x-10',
      },
      right: {
        content:
          'border-l border-border h-full w-3/4 inset-y-0 right-0 sm:max-w-sm enter-translate-x-10 exit-translate-x-10',
      },
      top: {
        content:
          'border-b border-border h-auto inset-x-0 top-0 -enter-translate-y-10 -exit-translate-y-10',
      },
    },
  },
})
