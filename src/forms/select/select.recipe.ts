import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  PRIMARY_TRIGGER_CLASS,
  SELECT_TRIGGER_FOCUS_CLASS,
} from '../shared/select/select-field.class.ts'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types'

const SELECT_VARIANTS = {
  outline: { ...FIELD_VARIANTS.outline, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  subtle: { ...FIELD_VARIANTS.subtle, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  ghost: { ...FIELD_VARIANTS.ghost, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  none: FIELD_VARIANTS.none,
} as const

export const selectRecipe = /* @__PURE__ */ defineRecipe<SelectStyleSlot, SelectStyleVariant>(
  'select',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      control: `${SELECT_FAMILY_SLOTS.control} relative`,
      trigger: PRIMARY_TRIGGER_CLASS,
      value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: SELECT_VARIANTS, size: FIELD_SIZES },
  } as const,
)
