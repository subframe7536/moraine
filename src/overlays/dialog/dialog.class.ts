import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'
import { MODAL_CONTENT_CLASS, MODAL_CONTENT_DEFAULT_CLASS } from '../base/modal.class.ts'

export const DIALOG_HEADER_CLASS = 'p-6 flex gap-2 items-start'
export const DIALOG_WRAPPER_CLASS = 'flex-1 grid gap-1.5 min-w-0'
export const DIALOG_TITLE_CLASS = 'text-lg font-semibold leading-none text-foreground'
export const DIALOG_DESCRIPTION_CLASS = 'text-sm text-muted-foreground'
export const DIALOG_CLOSE_CLASS = 'absolute top-4 right-4'
export const DIALOG_BODY_CLASS = 'flex-1 min-h-0 overflow-y-auto text-sm text-foreground'
export const DIALOG_FOOTER_CLASS =
  'px-6 pb-6 pt-2 flex flex-col-reverse gap-2 sm:(flex-row justify-end items-center)'

export const dialogContentVariants = cva(MODAL_CONTENT_CLASS, {
  defaultVariants: {
    layout: 'default',
  },
  variants: {
    layout: {
      default: MODAL_CONTENT_DEFAULT_CLASS,
      scrollable:
        'p-4 size-full pointer-events-none inset-0 place-items-center fixed overflow-y-auto sm:py-8',
      fullscreen: 'flex flex-col size-full max-w-none inset-0 fixed',
    },
  },
})

export const dialogCardVariants = cva(
  'text-popover-foreground surface-overlay bg-popover flex flex-col max-h-full w-full shadow-lg overflow-hidden',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default: 'rounded-xl',
        scrollable: 'my-auto rounded-xl max-w-[calc(100%-2rem)] pointer-events-auto sm:max-w-md',
        fullscreen: 'border-0 rounded-none h-full ring-0',
      },
    },
  },
)

export type DialogCardVariantProps = VariantProps<typeof dialogCardVariants>
