import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import type { OverlayAlign } from '../../theme/style-types'

import type { ToastStyleSlot, ToastStyleVariant } from './toast.style-types'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastT } from './toast.types'

export const toastListDataAttributes = /* @__PURE__ */ createDataAttributes('expanded')

const toastRootDataAttributes = /* @__PURE__ */ createDataAttributes(
  'front',
  'behind',
  'expanded',
  'limited',
  'bump',
  'swiping',
  'swipe-out',
)

export const toastDataAttributes = {
  root: toastRootDataAttributes,
} satisfies DataAttributeContract<keyof ToastStyleSlot>

export { toastRootDataAttributes }

/** Base viewport class for toast list containers. */
export const TOAST_VIEWPORT_BASE_CLASS = 'm-0 outline-none list-none flex flex-col fixed z-floating'

/** Resolves viewport positioning classes based on placement and alignment. */
export function getToastPlacementClass(
  placement: ToastT.Placement = 'bottom',
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

  if (align === 'start') {
    return 'bottom-4 left-4 items-start'
  }
  if (align === 'center') {
    return 'bottom-4 left-1/2 -translate-x-1/2 items-center'
  }
  return 'bottom-4 right-4 items-end'
}

export const toastRecipe = /* @__PURE__ */ defineRecipe<ToastStyleSlot, ToastStyleVariant>(
  'toast',
  {
    base: {
      '--toast-gap': `${DEFAULT_TOAST_GAP}px`,
      root: `text-popover-foreground p-4 outline-none will-change-transform border border-border rounded-lg bg-popover flex gap-3 max-w-[calc(100vw-2rem)] w-sm select-none shadow-overlay items-center absolute overflow-hidden touch-none ${FOCUS_VISIBLE_CLASS} transition-[transform,opacity,height,box-shadow] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] data-limited:(opacity-0 pointer-events-none) data-swipe-out:(duration-200 ease-out) data-swiping:transition-none motion-reduce:transition-none data-bump:animate-toast-bump motion-reduce:animate-none data-expanded:after:(h-[calc(var(--toast-gap)+1px)] w-full content-[''] bottom-full left-0 absolute) data-bump:motion-reduce:animate-none`,
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
          icon: 'text-muted-foreground animate-spin motion-reduce:animate-none',
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
