import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_INPUT_CLASS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
} from '../shared/select/select-field.class.ts'

import type { ComboboxStyleSlot, ComboboxStyleVariant } from './combobox.style-types'

export const comboboxRecipe = /* @__PURE__ */ defineRecipe<
  'combobox',
  ComboboxStyleSlot,
  ComboboxStyleVariant
>('combobox', {
  base: {
    ...SELECT_FAMILY_SLOTS,
    input: `${FIELD_INPUT_CLASS} text-start min-w-0 truncate py-1.5`,
    trigger: SECONDARY_TRIGGER_CLASS,
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
} as const)
