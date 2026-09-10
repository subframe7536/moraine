import { slotRecipe } from '../../shared/style/recipe'
import { MODAL_CONTENT_CLASS, MODAL_OVERLAY_CLASS } from '../modal/modal.class'

import type { DialogT } from './dialog.types'

export const DIALOG_CONTENT_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground border border-border shadow-md flex flex-col fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden`
export const DIALOG_CONTENT_SCROLLABLE_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground border border-border shadow-md flex flex-col relative mx-auto my-4 w-[calc(100vw-2rem)] max-w-lg`
export const DIALOG_CONTENT_FULLSCREEN_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground border border-border shadow-md flex flex-col fixed inset-0 size-full max-w-none max-h-none rounded-none border-0 ring-0 overflow-hidden`
export const DIALOG_HEADER_CLASS = 'flex shrink-0 items-start gap-2 p-6'
export const DIALOG_WRAPPER_CLASS = 'flex-1 grid gap-1.5 min-w-0'
export const DIALOG_TITLE_CLASS = 'text-lg font-semibold leading-none text-foreground'
export const DIALOG_DESCRIPTION_CLASS = 'text-sm text-muted-foreground'
export const DIALOG_CLOSE_CLASS = 'absolute top-4 right-4'
export const DIALOG_BODY_CLASS = 'flex-1 min-h-0 px-6 text-sm text-foreground'
export const DIALOG_FOOTER_CLASS =
  'shrink-0 p-6 pt-2 flex flex-col-reverse gap-2 sm:(flex-row justify-end items-center)'

export const dialogRecipe = /* @__PURE__ */ slotRecipe<DialogT.Slot, DialogT.Variant>({
  base: {
    trigger: '',
    overlay: `${MODAL_OVERLAY_CLASS} data-overlay-scroll:(p-4 overflow-y-auto)`,
    header: DIALOG_HEADER_CLASS,
    wrapper: `${DIALOG_WRAPPER_CLASS} data-close:pe-8`,
    title: DIALOG_TITLE_CLASS,
    description: DIALOG_DESCRIPTION_CLASS,
    close: `${DIALOG_CLOSE_CLASS} inline-flex items-center justify-center size-8 rounded-md hover:bg-accent focus-visible:(outline-none ring-2 ring-ring) disabled:(pointer-events-none opacity-50)`,
    body: `${DIALOG_BODY_CLASS} pt-6 pb-6 data-header:pt-0 data-footer:pb-2 data-scroll:overflow-y-auto`,
    footer: DIALOG_FOOTER_CLASS,
  },
  variants: {
    fullscreen: {
      true: { content: DIALOG_CONTENT_FULLSCREEN_CLASS },
      false: {},
    },
    scrollable: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      variants: { fullscreen: false, scrollable: false },
      content: DIALOG_CONTENT_CLASS,
    },
    {
      variants: { fullscreen: false, scrollable: true },
      content: DIALOG_CONTENT_SCROLLABLE_CLASS,
    },
  ],
  defaults: { fullscreen: false, scrollable: false },
})
