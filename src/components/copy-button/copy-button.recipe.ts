import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { BUTTON_ACTION_VARIANT, BUTTON_BASE_ROOT_CLASS, BUTTON_SIZE } from '../button/button.recipe'

import type { CopyButtonStyleSlot, CopyButtonStyleVariants } from './copy-button.style-types'

export const COPY_BUTTON_ERROR_CLASS =
  'data-error:(border-danger ring-3 ring-danger/20) dark:data-error:(border-danger/50 ring-danger/40)'
export const COPY_BUTTON_ICON_CLASS = 'group relative'
export const COPY_BUTTON_ICON_IDLE_CLASS =
  'transition-[opacity,transform] group-data-[copied]:(opacity-0 pointer-events-none scale-75)'
export const COPY_BUTTON_ICON_COPIED_CLASS =
  'opacity-0 pointer-events-none scale-75 transition-[opacity,transform] inset-0 absolute group-data-[copied]:(opacity-100 pointer-events-auto scale-100)'
export const COPY_BUTTON_LABEL_CLASS = 'min-w-0 truncate'

export const copyButtonDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('copied', 'error', 'disabled'),
  icon: /* @__PURE__ */ createDataAttributes('copied'),
} satisfies DataAttributeContract<keyof CopyButtonStyleSlot>

export const copyButtonRecipe = /* @__PURE__ */ defineRecipe<
  CopyButtonStyleSlot,
  CopyButtonStyleVariants
>('copyButton', {
  base: {
    root: `${BUTTON_BASE_ROOT_CLASS}  ${COPY_BUTTON_ERROR_CLASS}`,
    icon: COPY_BUTTON_ICON_CLASS,
    label: COPY_BUTTON_LABEL_CLASS,
  },
  defaultVariants: {
    size: 'icon-md',
    variant: 'ghost',
    tone: 'neutral',
  },
  variants: {
    variant: BUTTON_ACTION_VARIANT,
    copiedVariant: BUTTON_ACTION_VARIANT,
    tone: TONE_VARS,
    copiedTone: TONE_VARS,
    size: BUTTON_SIZE,
  },
})
