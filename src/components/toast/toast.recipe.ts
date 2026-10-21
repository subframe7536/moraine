import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ToastStyleSlot, ToastStyleVariants } from './toast.style-types'
import { DEFAULT_TOAST_GAP } from './toast.types'

export const TOAST_PROGRESS_CLASS =
  'bg-primary size-full origin-left animate-toast-progress motion-reduce:animate-none'

export const toastDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes(
    'front',
    'behind',
    'expanded',
    'limited',
    'bump',
    'swiping',
    'swipe-out',
    'closed',
  ),
  list: /* @__PURE__ */ createDataAttributes('expanded'),
} satisfies DataAttributeContract<keyof ToastStyleSlot>

export const toastRecipe = /* @__PURE__ */ defineRecipe<ToastStyleSlot, ToastStyleVariants>(
  'toast',
  {
    base: {
      '--toast-gap': `${DEFAULT_TOAST_GAP}px`,
      '--toast-index': 0,
      '--toast-offset-y': '0px',
      root: 'pointer-events-none fixed z-floating',
      list: 'outline-none list-none flex flex-col w-sm pointer-events-auto fixed z-floating',
      item: `text-popover-foreground p-4 outline-none will-change-transform border border-border rounded-xl bg-popover flex gap-3 max-w-[calc(100vw-2rem)] w-sm select-none shadow-overlay absolute overflow-hidden touch-none ${FOCUS_VISIBLE_CLASS} transition-[transform,opacity,height,box-shadow] duration-400 data-limited:(opacity-0 pointer-events-none) data-swipe-out:duration-200 data-swiping:transition-none motion-reduce:transition-none data-bump:animate-toast-bump motion-reduce:animate-none`,
      wrapper: 'flex flex-1 flex-col gap-1 min-w-0 overflow-hidden',
      title: 'text-sm text-foreground leading-5 font-medium',
      description: 'text-sm text-muted-foreground leading-normal',
      icon: 'text-base flex shrink-0 size-5 items-center justify-center',
      actions: 'flex shrink-0 gap-2 items-center',
      close: 'text-muted-foreground shrink-0 transition-colors hover:text-foreground',
      action: 'shrink-0',
      cancel: 'shrink-0',
      progress: 'bg-muted h-1 bottom-0 left-0 right-0 absolute overflow-hidden',
    },
    variants: {
      type: {
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
      large: {
        true: {
          item: 'flex-wrap items-start',
          actions: 'mt-1 w-full justify-end',
          close: 'right-3.5 top-3.5 absolute',
        },
        false: {
          item: 'items-center',
        },
      },
      invert: {
        true: {
          item: 'text-background border-transparent bg-foreground',
        },
        false: {
          item: 'text-popover-foreground border-border bg-popover',
        },
      },
      placement: {
        top: {
          root: 'top-4',
          list: 'top-4',
          item: 'top-0',
        },
        bottom: {
          root: 'bottom-4',
          list: 'bottom-4',
          item: 'bottom-0',
        },
      },
      align: {
        start: {
          root: 'left-4',
          list: 'items-start left-4',
          item: 'left-0',
        },
        center: {
          // No transform here: it would become the containing block for the fixed lists.
          root: 'mx-auto left-0 right-0',
          list: 'items-center left-1/2 -translate-x-1/2',
          item: 'mx-auto left-0 right-0',
        },
        end: {
          root: 'right-4',
          list: 'items-end right-4',
          item: 'right-0',
        },
      },
    },
    defaultVariants: {
      type: 'default',
      large: false,
      invert: false,
      placement: 'bottom',
      align: 'end',
    },
  },
)
