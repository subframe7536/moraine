import { createCssVariables, createDataAttributes } from '../../../shared/style-contract.ts'
import type { StyleContractState } from '../../../shared/style-contract.ts'
import type { RecipeConfig } from '../../../theme/style/recipe.ts'

import type { OverlayMenuStyleSlot, OverlayMenuStyleVariant } from './style-types.ts'

export const overlayMenuDataAttributes = {
  content: (state: StyleContractState) =>
    createDataAttributes({
      'data-align': state.align,
      'data-closed': state.closed,
      'data-expanded': state.expanded,
      'data-side': state.side,
    }),
  item: (state: StyleContractState) =>
    createDataAttributes({
      'data-destructive': state.destructive,
      'data-disabled': state.disabled,
      'data-expanded': state.expanded,
      'data-highlighted': state.highlighted,
      'data-selected': state.selected,
    }),
}

export const overlayMenuCssVariables = {
  content: (state: StyleContractState) =>
    createCssVariables({
      '--mo-popper-content-transform-origin': state['popper-content-transform-origin'],
    }),
}

export const overlayMenuRecipeOptions = {
  base: {
    trigger: '',
    overlay: 'inset-0 fixed z-overlay',
    content:
      'text-popover-foreground p-1 outline-none border border-border rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-(--mo-popper-content-transform-origin) z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=right]:ml-(--mo-popper-content-overflow-padding) data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1 data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=left]:mr-(--mo-popper-content-overflow-padding) data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1',
    group: '',
    item: 'text-sm px-1.5 py-1 text-foreground outline-none rounded-sm flex gap-1.5 w-full cursor-default select-none items-center relative data-highlighted:bg-muted data-disabled:opacity-50 data-expanded:bg-muted data-destructive:text-destructive data-destructive:data-highlighted:(bg-destructive/15 dark:bg-destructive/25 text-destructive)',
    itemLeading: 'inline-flex shrink-0 size-4 items-center justify-center [&_svg]:size-4',
    itemWrapper: 'flex flex-1 flex-col gap-0.5 min-w-0',
    itemLabel: 'truncate',
    itemDescription: 'text-xs text-muted-foreground truncate',
    itemTrailing:
      'text-sm ms-auto inline-flex shrink-0 gap-2 pointer-events-none items-center justify-end',
    itemKbds: '',
    itemIndicator: 'flex shrink-0 size-4 pointer-events-none items-center justify-center',
    itemSubIndicator: '',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 inline-flex',
    separator: 'my-1 bg-border h-px -mx-1',
  },
  variants: {
    size: {
      sm: { item: 'text-xs' },
      md: { item: 'text-sm' },
      lg: { item: 'text-base' },
    },
  },
  defaultVariants: { size: 'md' },
} as const satisfies RecipeConfig<OverlayMenuStyleSlot, OverlayMenuStyleVariant>
