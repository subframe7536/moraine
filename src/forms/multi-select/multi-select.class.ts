import { slotRecipe } from '../../shared/style/recipe.ts'
import {
  COMMON_CONTROL_SLOTS,
  FIELD_CONTROL_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.class.ts'

import type { MultiSelectT } from './multi-select.types.ts'

export const multiSelectRecipe = /* @__PURE__ */ slotRecipe<
  MultiSelectT.Slot,
  MultiSelectT.Variant
>({
  base: {
    ...COMMON_CONTROL_SLOTS,
    control: `${FIELD_CONTROL_CLASS} data-tags:ps-1`,
    input: `${FIELD_INPUT_CLASS} min-w-12 py-0.5`,
    trigger: SECONDARY_TRIGGER_CLASS,
    ...TAG_SLOTS,
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: {
    variant: FIELD_VARIANTS,
    size: {
      sm: { ...TAG_SIZES.sm, tagOverflow: 'text-xs' },
      md: { ...TAG_SIZES.md, tagOverflow: 'text-sm' },
      lg: { ...TAG_SIZES.lg, tagOverflow: 'text-base' },
    },
  },
} as const)
