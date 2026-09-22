import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'
import { modalDataAttributes } from '../modal/modal.recipe.ts'

import type { PopoverStyleSlot } from './popover.style-types'

export const popoverDataAttributes = {
  trigger: modalDataAttributes.trigger,
  content: (state: StyleContractState) =>
    createDataAttributes({
      'data-closed': state.closed,
      'data-expanded': state.expanded,
      'data-side': state.side,
    }),
}

export const popoverContentDataAttributes = (state: StyleContractState) =>
  createDataAttributes({ 'data-side': state.side })

export const popoverRecipe = /* @__PURE__ */ defineRecipe<PopoverStyleSlot>('popover', {
  base: {
    trigger: '',
    content:
      'text-popover-foreground outline-none border border-border rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 shadow-md origin-(--mo-popper-content-transform-origin) relative z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=left]:mr-(--mo-popper-content-overflow-padding) data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=right]:ml-(--mo-popper-content-overflow-padding) data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1 data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1',
    body: 'max-h-(--mo-popper-content-available-height) overflow-auto',
  },
})
