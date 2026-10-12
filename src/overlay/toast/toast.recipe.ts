import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ToastStyleSlot, ToastStyleVariant } from './toast.style-types'
import { DEFAULT_TOAST_GAP } from './toast.types'

export const toastDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'front',
    'behind',
    'expanded',
    'limited',
    'bump',
    'swiping',
    'swipe-out',
  ),
  /** Stack list (`ul`) expanded state. */
  list: /* @__PURE__ */ createDataAttributes('expanded'),
} satisfies DataAttributeContract<keyof ToastStyleSlot>

export const toastRecipe = /* @__PURE__ */ defineRecipe<ToastStyleSlot, ToastStyleVariant>(
  'toast',
  {
    base: {
      '--toast-gap': `${DEFAULT_TOAST_GAP}px`,
      // Corner-anchored and sized to the toast width; never a full-screen overlay.
      viewport: 'max-w-[calc(100vw-2rem)] w-sm pointer-events-none fixed z-floating',
      list: 'm-0 outline-none list-none flex flex-col w-sm pointer-events-auto fixed z-floating',
      root: `text-popover-foreground p-4 outline-none will-change-transform border border-border rounded-lg bg-popover flex gap-3 max-w-[calc(100vw-2rem)] w-sm select-none shadow-overlay items-center absolute overflow-hidden touch-none ${FOCUS_VISIBLE_CLASS} transition-[transform,opacity,height,box-shadow] duration-400 data-limited:(opacity-0 pointer-events-none) data-swipe-out:duration-200 data-swiping:transition-none motion-reduce:transition-none data-bump:animate-toast-bump motion-reduce:animate-none`,
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
          icon: 'text-success',
        },
        error: {
          icon: 'text-danger',
        },
        warning: {
          icon: 'text-warning',
        },
        info: {
          icon: 'text-info',
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
      placement: {
        top: {
          viewport: 'top-4',
          list: 'top-4',
          root: 'top-0',
        },
        bottom: {
          viewport: 'bottom-4',
          list: 'bottom-4',
          root: 'bottom-0',
        },
      },
      align: {
        start: {
          viewport: 'left-4',
          list: 'items-start left-4',
          root: 'left-0',
        },
        center: {
          // No transform here: it would become the containing block for the fixed lists.
          viewport: 'mx-auto left-0 right-0',
          list: 'items-center left-1/2 -translate-x-1/2',
          root: 'mx-auto left-0 right-0',
        },
        end: {
          viewport: 'right-4',
          list: 'items-end right-4',
          root: 'right-0',
        },
      },
    },
    defaultVariants: {
      variant: 'default',
      invert: false,
      placement: 'bottom',
      align: 'end',
    },
  },
)
