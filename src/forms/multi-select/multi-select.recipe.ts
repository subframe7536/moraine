import { TEXT_SIZE_VARIANT } from '../../shared/recipe-common.class.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  SELECT_FAMILY_SLOTS,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.class.ts'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

export const multiSelectRecipe = /* @__PURE__ */ defineRecipe<
  'multiSelect',
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
    variant: FIELD_VARIANTS,
    size: {
      sm: { ...TAG_SIZES.sm, tagOverflow: TEXT_SIZE_VARIANT.sm },
      md: { ...TAG_SIZES.md, tagOverflow: TEXT_SIZE_VARIANT.md },
      lg: { ...TAG_SIZES.lg, tagOverflow: TEXT_SIZE_VARIANT.lg },
    },
  },
} as const)
