import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ToggleButtonStyleSlot, ToggleButtonStyleVariant } from './toggle-button.style-types'

export const toggleButtonDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('pressed'),
} satisfies DataAttributeContract<keyof ToggleButtonStyleSlot>

export const toggleButtonRecipe = /* @__PURE__ */ defineRecipe<
  ToggleButtonStyleSlot,
  ToggleButtonStyleVariant
>('toggleButton', {
  base: { root: '', leading: '', label: '', trailing: '' },
  defaultVariants: {
    variant: 'ghost',
    activeVariant: 'secondary',
    size: 'md',
  },
})
