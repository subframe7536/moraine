import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import type { OverlayAlign } from '../../theme/style-types'

import type { ToasterStyleSlot, ToasterStyleVariant } from './toaster.style-types'
import type { ToasterT } from './toaster.types'

export const toastListDataAttributes = /* @__PURE__ */ createDataAttributes('expanded')

export const toastDataAttributes = /* @__PURE__ */ createDataAttributes(
  'front',
  'behind',
  'expanded',
  'limited',
  'bump',
)

/** @deprecated Use toastDataAttributes instead. */
export const toastItemDataAttributes = toastDataAttributes

export const toasterDataAttributes = {
  root: toastDataAttributes,
} satisfies DataAttributeContract<keyof ToasterStyleSlot>

/** Base viewport class for toast list containers. */
export const TOAST_VIEWPORT_BASE_CLASS = 'm-0 outline-none list-none flex flex-col fixed z-floating'

/** Resolves viewport positioning classes based on placement and alignment. */
export function getToastPlacementClass(
  placement: ToasterT.Placement = 'bottom',
  align: OverlayAlign = 'end',
): string {
  if (placement === 'top') {
    if (align === 'start') {
      return 'top-4 left-4 items-start'
    }
    if (align === 'center') {
      return 'top-4 left-1/2 -translate-x-1/2 items-center'
    }
    return 'top-4 right-4 items-end'
  }

  // placement === 'bottom' (default)
  if (align === 'start') {
    return 'bottom-4 left-4 items-start'
  }
  if (align === 'center') {
    return 'bottom-4 left-1/2 -translate-x-1/2 items-center'
  }
  return 'bottom-4 right-4 items-end'
}

export const toasterRecipe = /* @__PURE__ */ defineRecipe<ToasterStyleSlot, ToasterStyleVariant>(
  'toaster',
  {
    base: {
      '--toast-gap': '0.75rem',
      '--toast-peek': '0.75rem',
      root: `text-popover-foreground p-4 outline-none will-change-transform border border-border rounded-lg bg-popover flex gap-3 max-w-[calc(100vw-2rem)] w-sm select-none shadow-overlay items-center absolute overflow-hidden touch-none ${FOCUS_VISIBLE_CLASS} data-limited:(opacity-0 pointer-events-none) data-bump:animate-toast-bump data-expanded:after:(h-[calc(var(--toast-gap,14px)+1px)] w-full content-[''] bottom-full left-0 absolute)`,
      content: 'flex flex-1 flex-col gap-1 min-w-0 overflow-hidden',
      title: 'text-sm text-foreground leading-none font-medium',
      description: 'text-xs text-muted-foreground leading-normal',
      icon: 'text-base flex shrink-0 items-center justify-center',
      close: 'text-muted-foreground shrink-0 transition-colors hover:text-foreground',
      action: 'shrink-0',
      cancel: 'shrink-0',
      progress: 'left-0 right-0 top-0 absolute overflow-hidden',
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
