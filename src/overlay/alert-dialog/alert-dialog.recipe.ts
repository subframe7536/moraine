import { defineRecipe } from '../../theme/recipe'

import type { AlertDialogStyleSlot, AlertDialogStyleVariant } from './alert-dialog.style-types'

export const ALERT_DIALOG_ICON_CLASS = 'text-xl shrink-0'
export const ALERT_DIALOG_CENTER_ICON_CLASS =
  'rounded-xl bg-muted flex shrink-0 size-10 items-center justify-center'
export const ALERT_DIALOG_ICON_TONE_CLASS = {
  confirm: 'text-danger',
  warning: 'text-warning',
  error: 'text-danger',
  info: 'text-info',
  success: 'text-success',
} as const

export const alertDialogRecipe = /* @__PURE__ */ defineRecipe<
  AlertDialogStyleSlot,
  AlertDialogStyleVariant
>('alertDialog', {
  base: {
    content: 'p-6 gap-4',
    header: 'p-0 flex gap-3 items-start',
    icon: ALERT_DIALOG_ICON_CLASS,
    copy: 'flex-1 gap-2 grid min-w-0',
    footer: 'p-0',
    action: '',
  },
  defaultVariants: {
    center: false,
    danger: false,
    subtle: false,
  },
  variants: {
    danger: {
      true: {},
    },
    subtle: {
      true: {
        content: 'p-0 gap-0',
        header: 'px-6 pb-6 pt-6',
        footer: 'px-6 pb-6 pt-4 border-t border-border bg-muted/50',
      },
    },
    center: {
      true: {
        content: 'p-0 gap-0',
        header: 'px-6 pb-6 pt-6 text-center flex flex-col gap-4 items-center',
        copy: 'text-center flex-none',
        footer: 'px-6 pb-6 pt-4 border-t border-border flex-row gap-3',
        action: 'flex-1',
      },
    },
  },
})
