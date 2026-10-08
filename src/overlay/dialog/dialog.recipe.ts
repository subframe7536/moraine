import { defineRecipe } from '../../theme/recipe'
import { OVERLAY_CLOSE_BUTTON_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'
import {
  MODAL_CONTENT_CLASS,
  MODAL_OVERLAY_CLASS,
  modalDataAttributes,
} from '../modal/modal.recipe'

import type { DialogStyleSlot, DialogStyleVariant } from './dialog.style-types'

export const dialogDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  overlay: modalDataAttributes.overlay,
  content: modalDataAttributes.content,
  body: /* @__PURE__ */ createDataAttributes('footer', 'header', 'scroll'),
} satisfies DataAttributeContract<keyof DialogStyleSlot>

export const DIALOG_CONTENT_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground border border-border flex flex-col max-h-[calc(100dvh-2rem)] max-w-lg w-[calc(100vw-2rem)] left-1/2 top-1/2 fixed overflow-hidden sm:max-h-[calc(100dvh-4rem)] -translate-x-1/2 -translate-y-1/2`
export const DIALOG_CONTENT_SCROLLABLE_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground mx-auto my-4 border border-border flex flex-col max-w-lg w-[calc(100vw-2rem)] relative`
export const DIALOG_CONTENT_FULLSCREEN_CLASS = `${MODAL_CONTENT_CLASS} text-popover-foreground border-0 border-border rounded-none flex flex-col size-full max-h-none max-w-none ring-0 inset-0 fixed overflow-hidden`
export const DIALOG_HEADER_CLASS =
  'p-6 shrink-0 gap-2 grid auto-rows-min grid-cols-[minmax(0,1fr)_auto] items-start'
export const DIALOG_TITLE_CLASS = 'text-lg text-foreground leading-none font-semibold'
export const DIALOG_DESCRIPTION_CLASS = 'text-sm text-muted-foreground'
export const DIALOG_CONTENT_CLOSE_CLASS = 'right-4 top-4 absolute'
export const DIALOG_BODY_CLASS = 'text-sm text-foreground px-6 flex-1 min-h-0'
export const DIALOG_FOOTER_CLASS =
  'p-6 pt-2 flex shrink-0 flex-col-reverse gap-2 sm:(flex-row items-center justify-end)'

export const dialogRecipe = /* @__PURE__ */ defineRecipe<DialogStyleSlot, DialogStyleVariant>(
  'dialog',
  {
    base: {
      trigger: '',
      content: '',
      overlay: `${MODAL_OVERLAY_CLASS} data-overlay-scroll:(p-4 overflow-y-auto)`,
      header: `${DIALOG_HEADER_CLASS} min-w-0`,
      title: `${DIALOG_TITLE_CLASS} col-start-1`,
      description: `${DIALOG_DESCRIPTION_CLASS} col-start-1`,
      action: 'row-span-2 col-start-2 row-start-1 self-start justify-self-end',
      contentClose: `${DIALOG_CONTENT_CLOSE_CLASS}  ${OVERLAY_CLOSE_BUTTON_CLASS}`,
      body: `${DIALOG_BODY_CLASS} pb-6 pt-6 data-footer:pb-2 data-header:pt-0 data-scroll:overflow-y-auto`,
      footer: DIALOG_FOOTER_CLASS,
    },
    variants: {
      fullscreen: {
        true: { content: DIALOG_CONTENT_FULLSCREEN_CLASS },
      },
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
    defaultVariants: { fullscreen: false, scrollable: false },
  },
)
