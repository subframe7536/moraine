import { defineRecipe } from '../../theme/recipe'
import { OVERLAY_CLOSE_BUTTON_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'
import { MODAL_OVERLAY_CLASS, modalDataAttributes } from '../modal/modal.recipe'

import type { SheetStyleSlot, SheetStyleVariant } from './sheet.style-types'

export const sheetDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  overlay: modalDataAttributes.overlay,
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'transition'),
  body: /* @__PURE__ */ createDataAttributes('header'),
} satisfies DataAttributeContract<keyof SheetStyleSlot>

export const sheetRecipe = /* @__PURE__ */ defineRecipe<SheetStyleSlot, SheetStyleVariant>(
  'sheet',
  {
    base: {
      trigger: '',
      content:
        'text-sm text-popover-foreground pb-(--sheet-keyboard-inset) outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-overlay [--sheet-keyboard-inset:0px] fixed z-floating bg-clip-padding data-transition:data-closed:(animate-mo-exit exit-opacity-0) data-transition:data-expanded:(animate-mo-enter enter-opacity-0) data-transition:motion-reduce:animate-none',
      overlay: MODAL_OVERLAY_CLASS,
      header: 'p-4 gap-0.5 grid auto-rows-min min-w-0',
      title: 'text-foreground font-medium',
      description: 'text-sm text-muted-foreground',
      contentClose: `right-4 top-4 absolute ${OVERLAY_CLOSE_BUTTON_CLASS}`,
      body: 'flex-1 overflow-auto data-header:(px-4 pb-4 pt-0)',
      footer: 'mt-auto p-4 flex flex-col gap-2',
    },
    defaultVariants: {
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
            'border-l border-border h-full w-3/4 inset-y-0 right-0 enter-translate-x-10 exit-translate-x-10 sm:max-w-sm',
        },
        top: {
          content:
            'border-b border-border h-auto inset-x-0 top-0 -enter-translate-y-10 -exit-translate-y-10',
        },
      },
    },
  },
)
