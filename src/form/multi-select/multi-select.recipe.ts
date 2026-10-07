import { defineRecipe } from '../../theme/recipe'
import { groupAccentClass } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe'
import {
  SECONDARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
  SELECT_TRIGGER_FIELD_VARIANTS,
  TAG_FIELD_CONTROL_CLASS,
  TAG_FIELD_INPUT_CLASS,
  TAG_SIZES,
  TAG_SLOTS,
  selectItemDataAttributes,
} from '../shared/select/select-field.recipe'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

export const MULTI_SELECT_PLACEHOLDER_CLASS = 'text-muted-foreground/70 py-0.5 flex-1 min-w-12'

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
  ...selectItemDataAttributes,
  input: createDataAttributes('duplicate'),
  trigger: createDataAttributes('closed', 'disabled', 'expanded', 'invalid', 'loading'),
} satisfies DataAttributeContract<keyof MultiSelectStyleSlot>

export const multiSelectRecipe = /* @__PURE__ */ defineRecipe<
  MultiSelectStyleSlot,
  MultiSelectStyleVariant
>('multiSelect', {
  base: {
    ...SELECT_FAMILY_SLOTS,
    empty: '',
    control: TAG_FIELD_CONTROL_CLASS,
    input: TAG_FIELD_INPUT_CLASS,
    trigger: SECONDARY_TRIGGER_CLASS,
    ...TAG_SLOTS,
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaultVariants: { variant: 'outline', size: 'md' },
  variants: {
    variant: {
      ...SELECT_TRIGGER_FIELD_VARIANTS,
      ghost: {
        ...SELECT_TRIGGER_FIELD_VARIANTS.ghost,
        tagOverflow: groupAccentClass('select-control'),
      },
    },
    size: TAG_SIZES,
  },
})
