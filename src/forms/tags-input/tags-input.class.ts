import { slotRecipe } from '../../shared/style/recipe.ts'
import {
  FIELD_VARIANTS,
  SELECT_CLEAR_ACTION_CLASS,
  SELECT_LEADING_ICON_CLASS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.class.ts'

import type { TagsInputT } from './tags-input.types.ts'

export const tagsInputRecipe = /* @__PURE__ */ slotRecipe<TagsInputT.Slot, TagsInputT.Variant>({
  base: {
    control: TAG_FIELD_CONTROL_CLASS,
    leading: SELECT_LEADING_ICON_CLASS,
    input: `${TAG_FIELD_INPUT_CLASS} data-duplicate:text-destructive`,
    clear: SELECT_CLEAR_ACTION_CLASS,
    ...TAG_SLOTS,
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: TAG_SIZES },
} as const)
