import {
  POPPER_CONTENT_MAX_HEIGHT_CLASS,
  POPPER_CONTENT_MAX_WIDTH_CLASS,
  POPPER_SIDE_Y_CLASS,
} from '../../overlay/base/popper.class'
import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, TEXT_SIZE_VARIANT } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { BaseSelectStyleSlot, BaseSelectStyleVariant } from './base-select.style-types'

export const BASE_SELECT_POSITIONER_CLASS = 'z-floating'

const SELECT_CONTENT_CLASS = `text-popover-foreground p-0 outline-none border border-border rounded-md bg-popover flex flex-col ${POPPER_CONTENT_MAX_WIDTH_CLASS} min-w-(--mo-popper-anchor-width) w-(--mo-popper-anchor-width) shadow-overlay origin-(--mo-popper-content-transform-origin) z-floating ${POPPER_SIDE_Y_CLASS} data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none`

export const baseSelectDataAttributes = {
  control: createDataAttributes(
    'closed',
    'disabled',
    'expanded',
    'invalid',
    'readonly',
    'required',
  ),
  trigger: createDataAttributes('closed', 'disabled', 'expanded', 'invalid'),
  content: createDataAttributes('closed', 'expanded', 'side'),
  item: createDataAttributes('disabled', 'highlighted', 'selected'),
} satisfies DataAttributeContract<keyof BaseSelectStyleSlot>

export const baseSelectRecipe = /* @__PURE__ */ defineRecipe<
  BaseSelectStyleSlot,
  BaseSelectStyleVariant
>('baseSelect', {
  base: {
    control: '',
    trigger: '',
    content: SELECT_CONTENT_CLASS,
    listbox: `m-0 p-1 outline-none ${POPPER_CONTENT_MAX_HEIGHT_CLASS} overflow-y-auto empty:p-0`,
    item: `px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center relative data-highlighted:text-accent-foreground data-highlighted:bg-accent-hover ${DATA_DISABLED_CLASS}`,
    group: 'mt-1.5 first:mt-0',
    groupLabel: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    separator: 'my-1 bg-border h-px',
    empty: 'text-sm text-muted-foreground p-2 text-center',
  },
  defaultVariants: { size: 'md' },
  variants: {
    size: {
      sm: { item: `${TEXT_SIZE_VARIANT.sm} min-h-7` },
      md: { item: `${TEXT_SIZE_VARIANT.md} min-h-8` },
      lg: { item: `${TEXT_SIZE_VARIANT.lg} min-h-9` },
    },
  },
})
