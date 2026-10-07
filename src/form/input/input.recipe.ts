import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { TEXT_CONTROL_CLASS } from '../shared/text-control.class'
import {
  GROUPED_EDGE_CLASS,
  TEXT_CONTROL_GROUPED,
  TEXT_CONTROL_VARIANT,
} from '../shared/text-control.recipe'

import type { InputRecipeVariant, InputStyleSlot } from './input.style-types'

export const inputDataAttributes = {
  root: createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
} satisfies DataAttributeContract<keyof InputStyleSlot>

export const inputRecipe = /* @__PURE__ */ defineRecipe<InputStyleSlot, InputRecipeVariant>(
  'input',
  {
    base: {
      root: `${TEXT_CONTROL_CLASS} [&[type=file]]:text-muted-foreground file:(font-medium me-1.5 outline-none)`,
    },
    defaultVariants: { size: 'md', variant: 'outline', grouped: false },
    variants: {
      size: {
        sm: { root: 'text-xs leading-4 px-1.5 py-1 rounded-sm h-7' },
        md: { root: 'text-sm leading-5 px-2 py-1.5 rounded-md h-8' },
        lg: { root: 'text-base leading-6 px-2.5 py-2 rounded-lg h-9' },
      },
      grouped: TEXT_CONTROL_GROUPED,
    },
    compoundVariants: [
      { variants: { grouped: false, variant: 'outline' }, ...TEXT_CONTROL_VARIANT.outline },
      { variants: { grouped: false, variant: 'subtle' }, ...TEXT_CONTROL_VARIANT.subtle },
      { variants: { grouped: false, variant: 'ghost' }, ...TEXT_CONTROL_VARIANT.ghost },
      { variants: { grouped: false, variant: 'none' }, ...TEXT_CONTROL_VARIANT.none },
      {
        variants: { grouped: true, groupedOrientation: 'horizontal', size: 'sm' },
        root: `h-6.5 ${GROUPED_EDGE_CLASS.horizontal.sm}`,
      },
      {
        variants: { grouped: true, groupedOrientation: 'horizontal', size: 'md' },
        root: `h-7.5 ${GROUPED_EDGE_CLASS.horizontal.md}`,
      },
      {
        variants: { grouped: true, groupedOrientation: 'horizontal', size: 'lg' },
        root: `h-8.5 ${GROUPED_EDGE_CLASS.horizontal.lg}`,
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'sm' },
        root: `flex-none w-full h-6.5 ${GROUPED_EDGE_CLASS.vertical.sm}`,
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'md' },
        root: `flex-none w-full h-7.5 ${GROUPED_EDGE_CLASS.vertical.md}`,
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'lg' },
        root: `flex-none w-full h-8.5 ${GROUPED_EDGE_CLASS.vertical.lg}`,
      },
    ],
  },
)
