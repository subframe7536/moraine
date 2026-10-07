import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe'
import {
  FIELD_INPUT_CLASS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
  selectItemDataAttributes,
} from '../shared/select/select-field.recipe'

import type { ComboboxStyleSlot, ComboboxStyleVariant } from './combobox.style-types'

export const comboboxDataAttributes = {
  control: createDataAttributes(
    'closed',
    'disabled',
    'editable',
    'expanded',
    'invalid',
    'readonly',
    'required',
  ),
  content: baseSelectDataAttributes.content,
  item: baseSelectDataAttributes.item,
  ...selectItemDataAttributes,
  trigger: createDataAttributes('loading'),
} satisfies DataAttributeContract<keyof ComboboxStyleSlot>

export const comboboxRecipe = /* @__PURE__ */ defineRecipe<ComboboxStyleSlot, ComboboxStyleVariant>(
  'combobox',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      empty: '',
      input: `${FIELD_INPUT_CLASS} text-start min-w-0 truncate py-1.5`,
      trigger: SECONDARY_TRIGGER_CLASS,
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
  } as const,
)
