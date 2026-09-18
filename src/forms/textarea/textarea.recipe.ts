import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  TEXT_CONTROL_CLASS,
  TEXT_CONTROL_GROUPED,
  TEXT_CONTROL_VARIANT,
} from '../shared/text-control.class.ts'

import type { TextareaRecipeVariant, TextareaStyleSlot } from './textarea.style-types'

export const textareaRecipe = /* @__PURE__ */ defineRecipe<
  TextareaStyleSlot,
  TextareaRecipeVariant
>('textarea', {
  base: { root: `${TEXT_CONTROL_CLASS} resize-y data-autoresize:resize-none` },
  defaultVariants: { size: 'md', variant: 'outline', grouped: false },
  variants: {
    size: {
      sm: { root: 'text-xs rounded-sm leading-4 px-1.5 py-1 min-h-14' },
      md: { root: 'text-sm rounded-md leading-5 px-2 py-1.5 min-h-16' },
      lg: { root: 'text-base rounded-lg leading-6 px-2.5 py-2 min-h-18' },
    },
    variant: { outline: {}, subtle: {}, ghost: {}, none: {} },
    grouped: TEXT_CONTROL_GROUPED,
    groupedOrientation: { horizontal: {}, vertical: {} },
  },
  compoundVariants: [
    { variants: { grouped: false, variant: 'outline' }, ...TEXT_CONTROL_VARIANT.outline },
    { variants: { grouped: false, variant: 'subtle' }, ...TEXT_CONTROL_VARIANT.subtle },
    { variants: { grouped: false, variant: 'ghost' }, ...TEXT_CONTROL_VARIANT.ghost },
    { variants: { grouped: false, variant: 'none' }, ...TEXT_CONTROL_VARIANT.none },
    {
      variants: { grouped: true, groupedOrientation: 'horizontal', size: 'sm' },
      root: 'ps-0 pe-0 first:ps-1.5 [&:nth-last-child(2)]:pe-1.5',
    },
    {
      variants: { grouped: true, groupedOrientation: 'horizontal', size: 'md' },
      root: 'ps-0 pe-0 first:ps-2 [&:nth-last-child(2)]:pe-2',
    },
    {
      variants: { grouped: true, groupedOrientation: 'horizontal', size: 'lg' },
      root: 'ps-0 pe-0 first:ps-2.5 [&:nth-last-child(2)]:pe-2.5',
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'sm' },
      root: 'flex-none w-full pt-0 pb-0 first:pt-1 [&:nth-last-child(2)]:pb-1',
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'md' },
      root: 'flex-none w-full pt-0 pb-0 first:pt-1.5 [&:nth-last-child(2)]:pb-1.5',
    },
    {
      variants: { grouped: true, groupedOrientation: 'vertical', size: 'lg' },
      root: 'flex-none w-full pt-0 pb-0 first:pt-2 [&:nth-last-child(2)]:pb-2',
    },
  ],
})
