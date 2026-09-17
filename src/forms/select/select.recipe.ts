import { defineRecipe } from '../../shared/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  PRIMARY_TRIGGER_CLASS,
} from '../shared/select/select-field.class.ts'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types.ts'

export const selectRecipe = /* @__PURE__ */ defineRecipe<
  'select',
  SelectStyleSlot,
  SelectStyleVariant
>('select', {
  base: {
    ...SELECT_FAMILY_SLOTS,
    trigger: PRIMARY_TRIGGER_CLASS,
    value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
} as const)
