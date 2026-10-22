import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { BUTTON_ACTION_VARIANT, BUTTON_BASE_ROOT_CLASS, BUTTON_SIZE } from '../button/button.recipe'

import type { CopyButtonStyleSlot, CopyButtonStyleVariants } from './copy-button.style-types'

export const copyButtonDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('copied', 'error', 'disabled'),
  icon: /* @__PURE__ */ createDataAttributes('copied'),
} satisfies DataAttributeContract<keyof CopyButtonStyleSlot>

export const copyButtonRecipe = /* @__PURE__ */ defineRecipe<
  CopyButtonStyleSlot,
  CopyButtonStyleVariants
>('copyButton', {
  base: {
    root: `${BUTTON_BASE_ROOT_CLASS} data-error:(border-danger ring-3 ring-danger/20)`,
    icon: 'group relative',
    label: 'min-w-0 truncate',
  },
  defaultVariants: {
    size: 'md',
    variant: 'ghost',
    tone: 'neutral',
  },
  variants: {
    variant: BUTTON_ACTION_VARIANT,
    tone: TONE_VARS,
    size: BUTTON_SIZE,
  },
})
