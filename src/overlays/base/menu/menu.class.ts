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
  'text-popover-foreground p-1 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin duration-100 z-50 data-[motion=placement]:animate-menu-origin-top-left data-closed:animate-menu-out data-expanded:animate-menu-in motion-reduce:animate-none data-[motion=placement]:data-[placement=bottom-end]:animate-menu-origin-top-right data-[motion=placement]:data-[placement=bottom]:animate-menu-origin-top-center data-[motion=placement]:data-[placement=left-end]:animate-menu-origin-bottom-right data-[motion=placement]:data-[placement=left-start]:animate-menu-origin-top-right data-[motion=placement]:data-[placement=left]:animate-menu-origin-top-right data-[motion=placement]:data-[placement=right-end]:animate-menu-origin-bottom-left data-[motion=placement]:data-[placement=top-end]:animate-menu-origin-bottom-right data-[motion=placement]:data-[placement=top-start]:animate-menu-origin-bottom-left data-[motion=placement]:data-[placement=top]:animate-menu-origin-bottom-center data-[motion=side]:data-[side=bottom]:animate-menu-side-bottom data-[motion=side]:data-[side=left]:animate-menu-side-left data-[motion=side]:data-[side=right]:animate-menu-side-right data-[motion=side]:data-[side=top]:animate-menu-side-top',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding',
        right: 'ml-$mo-popper-content-overflow-padding',
        bottom: 'mt-$mo-popper-content-overflow-padding',
        left: 'mr-$mo-popper-content-overflow-padding',
      },
    },
  },
)
