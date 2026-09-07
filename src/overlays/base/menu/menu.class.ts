import type { SlotRecipeOptions } from '../../../shared/style/recipe.ts'

import type { OverlayMenuSharedSlots } from './types.ts'

export const overlayMenuRecipeOptions = {
  base: {
    content:
      'text-popover-foreground p-1 outline-none border border-border rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-[var(--mo-popper-content-transform-origin)] z-floating data-closed:animate-mo-exit data-closed:exit-opacity-0 data-closed:exit-scale-95 data-expanded:animate-mo-enter data-expanded:enter-opacity-0 data-expanded:enter-scale-95 motion-reduce:animate-none data-[side=top]:mb-[var(--mo-popper-content-overflow-padding)] data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=right]:ml-[var(--mo-popper-content-overflow-padding)] data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1 data-[side=bottom]:mt-[var(--mo-popper-content-overflow-padding)] data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=left]:mr-[var(--mo-popper-content-overflow-padding)] data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1',
    overlay: 'inset-0 fixed z-overlay',
    item: 'text-sm px-2 py-1.5 outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-disabled:opacity-50 data-disabled:pointer-events-none data-expanded:bg-muted data-[color=default]:text-foreground data-[color=default]:data-highlighted:bg-muted data-[color=destructive]:text-destructive data-[color=destructive]:data-highlighted:bg-destructive/15',
    itemLeading: 'inline-flex shrink-0 size-4 items-center justify-center [&_svg]:size-4',
    itemWrapper: 'flex flex-1 flex-col gap-0.5 min-w-0',
    itemLabel: 'truncate',
    itemDescription: 'text-xs text-muted-foreground truncate',
    itemTrailing: 'text-sm ms-auto inline-flex gap-2 pointer-events-none items-center justify-end',
    itemIndicator: 'flex size-4 pointer-events-none items-center end-2 justify-center absolute',
    label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 inline-flex',
    separator: 'my-1 bg-border h-px -mx-1',
  },
  variants: {
    size: {
      sm: { item: 'text-xs min-h-7' },
      md: { item: 'text-sm min-h-8' },
      lg: { item: 'min-h-9' },
    },
  },
  defaultVariants: { size: 'md' },
} as const satisfies SlotRecipeOptions<keyof OverlayMenuSharedSlots>
