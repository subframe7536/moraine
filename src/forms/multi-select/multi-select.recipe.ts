import { TEXT_SIZE_VARIANT } from '../../shared/recipe-common.class.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
  SELECT_TRIGGER_FOCUS_CLASS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.class.ts'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

const MULTI_SELECT_VARIANTS = {
  outline: { ...FIELD_VARIANTS.outline, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  subtle: { ...FIELD_VARIANTS.subtle, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  ghost: { ...FIELD_VARIANTS.ghost, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  none: FIELD_VARIANTS.none,
} as const

export const multiSelectRecipe = /* @__PURE__ */ defineRecipe<
  MultiSelectStyleSlot,
  MultiSelectStyleVariant
>('multiSelect', {
  base: {
    ...SELECT_FAMILY_SLOTS,
    control: TAG_FIELD_CONTROL_CLASS,
    input: TAG_FIELD_INPUT_CLASS,
    trigger: SECONDARY_TRIGGER_CLASS,
    ...TAG_SLOTS,
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: {
    variant: MULTI_SELECT_VARIANTS,
    size: {
      sm: { ...TAG_SIZES.sm, tagOverflow: TEXT_SIZE_VARIANT.sm },
      md: { ...TAG_SIZES.md, tagOverflow: TEXT_SIZE_VARIANT.md },
      lg: { ...TAG_SIZES.lg, tagOverflow: TEXT_SIZE_VARIANT.lg },
    },
  },
})
