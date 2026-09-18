import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  FIELD_SIZES,
  PRIMARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
} from '../shared/select/select-field.class.ts'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types'

export const selectRecipe = /* @__PURE__ */ defineRecipe<SelectStyleSlot, SelectStyleVariant>(
  'select',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      trigger: PRIMARY_TRIGGER_CLASS,
      value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: SELECT_TRIGGER_FIELD_VARIANTS, size: FIELD_SIZES },
  } as const,
)
