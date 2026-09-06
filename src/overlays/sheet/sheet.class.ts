import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { MODAL_OVERLAY_CLASS } from '../modal/modal.class.ts'

import type { SheetT } from './sheet.types.ts'

export const sheetRecipeOptions = {
  base: {
    content:
      'text-sm text-popover-foreground outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-lg fixed z-floating bg-clip-padding data-closed:animate-mo-exit data-closed:exit-opacity-0 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 motion-reduce:animate-none data-[transition=false]:transition-none data-[transition=false]:animate-none',
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
  defaultVariants: {
    side: 'right',
    inset: false,
  },
  variants: {
    side: {
      top: {
        content:
          'border-b border-border h-auto -enter-translate-y-10 -exit-translate-y-10 inset-x-0 top-0',
      },
      right: {
        content:
          'border-l border-border h-full w-3/4 enter-translate-x-10 exit-translate-x-10 inset-y-0 right-0 sm:max-w-sm',
      },
      bottom: {
        content:
          'border-t border-border h-auto enter-translate-y-10 exit-translate-y-10 inset-x-0 bottom-0',
      },
      left: {
        content:
          'border-r border-border h-full w-3/4 -enter-translate-x-10 -exit-translate-x-10 inset-y-0 left-0 sm:max-w-sm',
      },
    },
    inset: {
      true: { content: 'sm:m-4 sm:border sm:border-border sm:rounded-2xl' },
      false: { content: 'rounded-none' },
    },
  },
} as const satisfies SlotRecipeOptions<keyof SheetT.Slot>
