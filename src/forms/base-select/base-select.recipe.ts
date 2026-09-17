import { TEXT_SIZE_VARIANT } from '../../shared/recipe-common.class.ts'
import { defineRecipe } from '../../shared/style/recipe.ts'

import type { BaseSelectStyleSlot, BaseSelectStyleVariant } from './base-select.style-types.ts'
const SELECT_CONTENT_CLASS =
  'text-popover-foreground p-0 outline-none rounded-md bg-popover flex flex-col min-w-36 max-w-(--mo-popper-content-available-width) min-w-(--mo-popper-anchor-width) w-(--mo-popper-anchor-width) origin-(--mo-popper-content-transform-origin) z-floating motion-reduce:animate-none border border-border shadow-md data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1'

export const baseSelectRecipe = /* @__PURE__ */ defineRecipe<
  'baseSelect',
  BaseSelectStyleSlot,
  BaseSelectStyleVariant
>('baseSelect', {
  base: {
    control: '',
    trigger: '',
    content: SELECT_CONTENT_CLASS,
    listbox:
      'm-0 p-1 outline-none max-h-(--mo-popper-content-available-height) overflow-y-auto empty:p-0',
    item: 'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center relative data-highlighted:bg-muted data-disabled:(opacity-64 pointer-events-none)',
    group: '[&:not(:first-child)]:mt-1.5',
    groupLabel: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
    separator: 'my-1 h-px bg-border',
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
