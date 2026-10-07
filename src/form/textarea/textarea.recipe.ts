import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { TEXT_CONTROL_CLASS } from '../shared/text-control.class'
import {
  GROUPED_EDGE_CLASS,
  TEXT_CONTROL_GROUPED,
  TEXT_CONTROL_VARIANT,
} from '../shared/text-control.recipe'

import type { TextareaRecipeVariant, TextareaStyleSlot } from './textarea.style-types'

export const textareaDataAttributes = {
  root: createDataAttributes('autoresize', 'disabled', 'invalid', 'readonly', 'required'),
} satisfies DataAttributeContract<keyof TextareaStyleSlot>

export const textareaRecipe = /* @__PURE__ */ defineRecipe<
  TextareaStyleSlot,
  TextareaRecipeVariant
>('textarea', {
  base: { root: `${TEXT_CONTROL_CLASS} resize-y data-autoresize:resize-none` },
  defaultVariants: { size: 'md', variant: 'outline', grouped: false },
  variants: {
    size: {
      sm: { root: 'text-xs leading-4 px-1.5 py-1 rounded-sm min-h-14' },
      md: { root: 'text-sm leading-5 px-2 py-1.5 rounded-md min-h-16' },
      lg: { root: 'text-base leading-6 px-2.5 py-2 rounded-lg min-h-18' },
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
      root: GROUPED_EDGE_CLASS.horizontal.sm,
    },
    {
      variants: { grouped: true, groupedOrientation: 'horizontal', size: 'md' },
      root: GROUPED_EDGE_CLASS.horizontal.md,
    },
    {
      variants: { grouped: true, groupedOrientation: 'horizontal', size: 'lg' },
      root: GROUPED_EDGE_CLASS.horizontal.lg,
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'sm' },
      root: `flex-none w-full ${GROUPED_EDGE_CLASS.vertical.sm}`,
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'md' },
      root: `flex-none w-full ${GROUPED_EDGE_CLASS.vertical.md}`,
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'lg' },
      root: `flex-none w-full ${GROUPED_EDGE_CLASS.vertical.lg}`,
    },
  ],
})
