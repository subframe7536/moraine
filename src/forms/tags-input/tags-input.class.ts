import { slotRecipe } from '../../shared/style/recipe.ts'
import {
  FIELD_CONTROL_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_VARIANTS,
  SELECT_CLEAR_ACTION_CLASS,
  SELECT_LEADING_ICON_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.class.ts'

import type { TagsInputT } from './tags-input.types.ts'

export const tagsInputRecipe = /* @__PURE__ */ slotRecipe<TagsInputT.Slot, TagsInputT.Variant>({
  base: {
    control: `${FIELD_CONTROL_CLASS} data-tags:ps-1`,
    leading: SELECT_LEADING_ICON_CLASS,
    input: `${FIELD_INPUT_CLASS} min-w-12 py-0.5`,
    clear: SELECT_CLEAR_ACTION_CLASS,
    ...TAG_SLOTS,
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: TAG_SIZES },
} as const)
