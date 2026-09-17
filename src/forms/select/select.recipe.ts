import { defineRecipe } from '../../shared/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  PRIMARY_TRIGGER_CLASS,
} from '../shared/select/select-field.class.ts'

import type { SelectT } from './select.types.ts'

export const selectRecipe = /* @__PURE__ */ defineRecipe<'select', SelectT.Slot, SelectT.Variant>(
  'select',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      trigger: PRIMARY_TRIGGER_CLASS,
      value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
  } as const,
)
