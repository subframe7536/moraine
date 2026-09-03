import { MODAL_CONTENT_CLASS } from '../modal/modal.class.ts'

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
  'shrink-0 p-6 pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:items-center'
