import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { BUTTON_ACTION_VARIANT, BUTTON_BASE_ROOT_CLASS, BUTTON_SIZE } from '../button/button.recipe'

import type { CopyButtonStyleSlot, CopyButtonStyleVariants } from './copy-button.style-types'

export const copyButtonDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('copied', 'state', 'disabled'),
} satisfies DataAttributeContract<keyof CopyButtonStyleSlot>

export const copyButtonRecipe = /* @__PURE__ */ defineRecipe<
  CopyButtonStyleSlot,
  CopyButtonStyleVariants
>('copyButton', {
  base: {
    root: BUTTON_BASE_ROOT_CLASS,
    indicator: 'inline-flex flex-none select-none items-center justify-center relative',
    icon: 'transition-[opacity,transform] duration-200 ease-in-out',
    copiedIcon: 'm-auto transition-[opacity,transform] duration-200 ease-in-out inset-0 absolute',
    label: 'min-w-0 truncate',
    trailing: '',
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
