import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import type { OverlayAlign, OverlayPlacement } from '../../theme/style-types'

import type { ToasterStyleSlot, ToasterStyleVariant } from './toaster.style-types'

export const toastItemDataAttributes = /* @__PURE__ */ createDataAttributes(
  'index',
  'front',
  'behind',
  'expanded',
  'limited',
  'swiping',
  'bump',
  'type',
  'dismissible',
)

export const toasterDataAttributes = {
  root: toastItemDataAttributes,
} satisfies DataAttributeContract<keyof ToasterStyleSlot>

/** Base viewport class for toast list containers. */
export const TOAST_VIEWPORT_BASE_CLASS =
  'm-0 p-4 outline-none list-none flex flex-col pointer-events-none fixed z-floating'

/** Resolves viewport positioning classes based on placement and alignment. */
export function getToastPlacementClass(
  placement: OverlayPlacement = 'bottom',
  align: OverlayAlign = 'end',
): string {
  if (placement === 'top') {
    if (align === 'start') {
      return 'top-0 left-0 items-start'
    }
    if (align === 'center') {
      return 'top-0 left-1/2 -translate-x-1/2 items-center'
    }
    return 'top-0 right-0 items-end'
  }

  if (placement === 'left') {
    if (align === 'start') {
      return 'top-0 left-0 items-start'
    }
    if (align === 'center') {
      return 'top-1/2 left-0 -translate-y-1/2 items-start'
    }
    return 'bottom-0 left-0 items-start'
  }

  if (placement === 'right') {
    if (align === 'start') {
      return 'top-0 right-0 items-end'
    }
    if (align === 'center') {
      return 'top-1/2 right-0 -translate-y-1/2 items-end'
    }
    return 'bottom-0 right-0 items-end'
  }

  // placement === 'bottom' (default)
  if (align === 'start') {
    return 'bottom-0 left-0 items-start'
  }
  if (align === 'center') {
    return 'bottom-0 left-1/2 -translate-x-1/2 items-center'
  }
  return 'bottom-0 right-0 items-end'
}

export const toasterRecipe = /* @__PURE__ */ defineRecipe<ToasterStyleSlot, ToasterStyleVariant>(
  'toaster',
  {
    base: {
      '--toast-gap': '0.75rem',
      '--toast-peek': '0.75rem',
      '--toast-index': 0,
      '--toast-offset-y': '0px',
      '--toast-height': 'auto',
      '--toast-frontmost-height': 'auto',
      '--toast-swipe-movement-x': '0px',
      '--toast-swipe-movement-y': '0px',
      '--toast-scale': 1,
      root: 'text-popover-foreground p-4 outline-none will-change-transform border rounded-xl bg-popover flex gap-3 max-w-[calc(100vw-2rem)] w-sm pointer-events-auto select-none shadow-overlay transition-[transform,opacity,height,box-shadow] duration-300 ease-out items-center absolute overflow-hidden focus-visible:(border-ring ring-2 ring-ring/50) [&[data-behind]:not([data-expanded])>*]:opacity-0 data-limited:(opacity-0 pointer-events-none) data-swiping:transition-none data-transition:data-closed:(animate-mo-exit exit-opacity-0)',
      content: 'flex flex-1 flex-col gap-1 min-w-0 overflow-hidden',
      title: 'text-sm text-foreground leading-none font-medium',
      description: 'text-xs text-muted-foreground leading-normal',
      icon: 'text-base flex shrink-0 items-center justify-center',
      close: 'text-muted-foreground shrink-0 transition-colors hover:text-foreground',
      action: 'shrink-0',
      cancel: 'shrink-0',
      progress: 'bottom-0 left-0 right-0 absolute overflow-hidden',
    },
    variants: {
      variant: {
        default: {},
        success: {
          icon: 'text-emerald-500',
        },
        error: {
          icon: 'text-destructive',
        },
        warning: {
          icon: 'text-amber-500',
        },
        info: {
          icon: 'text-sky-500',
        },
        loading: {
          icon: 'text-muted-foreground animate-spin',
        },
      },
      invert: {
        true: {
          root: 'text-background border-transparent bg-foreground',
        },
        false: {
          root: 'text-popover-foreground border-border bg-popover',
        },
      },
    },
    defaultVariants: {
      variant: 'default',
      invert: false,
    },
  },
)
