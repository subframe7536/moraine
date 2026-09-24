import { createDataAttributes } from '../../shared/style-contract.ts'
import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'
import { baseSelectDataAttributes } from '../base-select/base-select.recipe.ts'
import {
  FIELD_INPUT_CLASS,
  FIELD_SIZES,
  FIELD_VARIANTS,
  SECONDARY_TRIGGER_CLASS,
  SELECT_FAMILY_SLOTS,
} from '../shared/select/select-field.recipe.ts'

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
  trigger: createDataAttributes('loading'),
} satisfies DataAttributeContract<keyof ComboboxStyleSlot>

export const comboboxRecipe = /* @__PURE__ */ defineRecipe<ComboboxStyleSlot, ComboboxStyleVariant>(
  'combobox',
  {
    base: {
      ...SELECT_FAMILY_SLOTS,
      input: `${FIELD_INPUT_CLASS} text-start min-w-0 truncate py-1.5`,
      trigger: SECONDARY_TRIGGER_CLASS,
    },
    defaultVariants: { variant: 'outline', size: 'md' },
    variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
  } as const,
)
