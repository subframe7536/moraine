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
  'text-popover-foreground p-1 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin duration-100 z-50 data-closed:animate-menu-out data-expanded:animate-menu-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'bottom',
      align: 'none',
      transitionMode: false,
    },
    variants: {
      align: {
        none: '',
        start: '',
        end: '',
      },
      side: {
        top: 'mb-$mo-popper-content-overflow-padding',
        right: 'ml-$mo-popper-content-overflow-padding',
        bottom: 'mt-$mo-popper-content-overflow-padding',
        left: 'mr-$mo-popper-content-overflow-padding',
      },
      transitionMode: {
        false: '',
        true: '',
      },
    },
    compoundVariants: [
      {
        side: 'top',
        transitionMode: false,
        class: 'animate-menu-side-top',
      },
      {
        side: 'right',
        transitionMode: false,
        class: 'animate-menu-side-right',
      },
      {
        side: 'bottom',
        transitionMode: false,
        class: 'animate-menu-side-bottom',
      },
      {
        side: 'left',
        transitionMode: false,
        class: 'animate-menu-side-left',
      },
      {
        align: 'start',
        side: 'top',
        transitionMode: true,
        class: 'animate-menu-origin-bottom-left',
      },
      {
        align: 'end',
        side: 'top',
        transitionMode: true,
        class: 'animate-menu-origin-bottom-right',
      },
      {
        align: 'none',
        side: 'top',
        transitionMode: true,
        class: 'animate-menu-origin-bottom-center',
      },
      {
        align: 'start',
        side: 'right',
        transitionMode: true,
        class: 'animate-menu-origin-top-left',
      },
      {
        align: 'end',
        side: 'right',
        transitionMode: true,
        class: 'animate-menu-origin-bottom-left',
      },
      {
        align: 'none',
        side: 'right',
        transitionMode: true,
        class: 'animate-menu-origin-top-left',
      },
      {
        align: 'start',
        side: 'bottom',
        transitionMode: true,
        class: 'animate-menu-origin-top-left',
      },
      {
        align: 'end',
        side: 'bottom',
        transitionMode: true,
        class: 'animate-menu-origin-top-right',
      },
      {
        align: 'none',
        side: 'bottom',
        transitionMode: true,
        class: 'animate-menu-origin-top-center',
      },
      {
        align: 'start',
        side: 'left',
        transitionMode: true,
        class: 'animate-menu-origin-top-right',
      },
      {
        align: 'end',
        side: 'left',
        transitionMode: true,
        class: 'animate-menu-origin-bottom-right',
      },
      {
        align: 'none',
        side: 'left',
        transitionMode: true,
        class: 'animate-menu-origin-top-right',
      },
    ],
  },
)
