import type { VariantProps } from 'cls-variant'

import { cva } from '../../../shared/utils.ts'

export const overlayMenuItemVariants = cva(
  'text-sm px-2 py-1.5 outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-disabled:(opacity-50 pointer-events-none)',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground data-highlighted:bg-muted',
        destructive: 'text-destructive data-highlighted:bg-destructive/15',
      },
      size: {
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8',
        lg: 'min-h-9',
      },
    },
  },
)

export type OverlayMenuItemVariantProps = VariantProps<typeof overlayMenuItemVariants>

export const overlayMenuContentVariants = cva(
  'text-popover-foreground p-1 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin z-floating data-closed:animate-menu-out data-expanded:animate-menu-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-menu-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-menu-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-menu-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-menu-side-left',
      },
    },
  },
)

export const OVERLAY_MENU_ITEM_ICON_CLASS =
  'inline-flex shrink-0 size-4 items-center justify-center [&_svg]:size-4'
export const OVERLAY_MENU_ITEM_WRAPPER_CLASS = 'flex flex-1 flex-col gap-0.5 min-w-0'
export const OVERLAY_MENU_ITEM_DESCRIPTION_CLASS = 'text-xs text-muted-foreground truncate'
export const OVERLAY_MENU_ITEM_TRAILING_CLASS =
  'text-sm ms-auto inline-flex gap-2 pointer-events-none items-center justify-end'
export const OVERLAY_MENU_ITEM_INDICATOR_CLASS =
  'flex size-4 pointer-events-none items-center end-2 justify-center absolute'
export const OVERLAY_MENU_LABEL_CLASS =
  'text-xs text-muted-foreground font-medium px-2 py-1.5 inline-flex'
export const OVERLAY_MENU_SEPARATOR_CLASS = 'my-1 bg-border h-px -mx-1'
export const OVERLAY_MENU_BACKDROP_CLASS = 'inset-0 fixed z-overlay'
