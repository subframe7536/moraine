import { createDataAttributes } from '../../shared/style-contract.ts'
import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe.ts'
import {
  SECONDARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
} from '../shared/select/select-field.recipe.ts'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

export const multiSelectDataAttributes = {
  control: createDataAttributes(
    'closed',
    'disabled',
    'editable',
    'expanded',
    'invalid',
    'readonly',
    'required',
    'tags',
  ),
  content: baseSelectDataAttributes.content,
  item: baseSelectDataAttributes.item,
  input: createDataAttributes('duplicate'),
  trigger: createDataAttributes('closed', 'disabled', 'expanded', 'invalid', 'loading'),
} satisfies DataAttributeContract<keyof MultiSelectStyleSlot>

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
    variant: SELECT_TRIGGER_FIELD_VARIANTS,
    size: TAG_SIZES,
  },
})
