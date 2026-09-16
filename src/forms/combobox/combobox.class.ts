import { slotRecipe } from '../../shared/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_INPUT_CLASS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
} from '../shared/select/select-field.class.ts'

import type { ComboboxT } from './combobox.types.ts'

export const comboboxRecipe = /* @__PURE__ */ slotRecipe<ComboboxT.Slot, ComboboxT.Variant>({
  base: {
    ...SELECT_FAMILY_SLOTS,
    input: `${FIELD_INPUT_CLASS} text-start min-w-0 truncate py-1.5`,
    trigger: SECONDARY_TRIGGER_CLASS,
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
} as const)
