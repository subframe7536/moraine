import { defineRecipe } from '../../theme/style/recipe.ts'
import {
  TEXT_CONTROL_CLASS,
  TEXT_CONTROL_GROUPED,
  TEXT_CONTROL_VARIANT,
} from '../shared/text-control.class.ts'

import type { InputRecipeVariant, InputStyleSlot } from './input.style-types'

export const inputRecipe = /* @__PURE__ */ defineRecipe<InputStyleSlot, InputRecipeVariant>(
  'input',
  {
    base: {
      root: `${TEXT_CONTROL_CLASS} [&[type=file]]:text-muted-foreground file:(font-medium me-1.5 outline-none)`,
    },
    defaultVariants: { size: 'md', variant: 'outline', grouped: false },
    variants: {
      size: {
        sm: { root: 'text-xs rounded-sm h-7 leading-4 px-1.5 py-1' },
        md: { root: 'text-sm rounded-md h-8 leading-5 px-2 py-1.5' },
        lg: { root: 'text-base rounded-lg h-9 leading-6 px-2.5 py-2' },
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
        root: 'h-6.5 ps-0 pe-0 first:ps-1.5 last:pe-1.5',
      },
      {
        variants: { grouped: true, groupedOrientation: 'horizontal', size: 'md' },
        root: 'h-7.5 ps-0 pe-0 first:ps-2 last:pe-2',
      },
      {
        variants: { grouped: true, groupedOrientation: 'horizontal', size: 'lg' },
        root: 'h-8.5 ps-0 pe-0 first:ps-2.5 last:pe-2.5',
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'sm' },
        root: 'flex-none w-full h-6.5 pt-0 pb-0 first:pt-1 last:pb-1',
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'md' },
        root: 'flex-none w-full h-7.5 pt-0 pb-0 first:pt-1.5 last:pb-1.5',
      },
      {
        variants: { grouped: true, groupedOrientation: 'vertical', size: 'lg' },
        root: 'flex-none w-full h-8.5 pt-0 pb-0 first:pt-2 last:pb-2',
      },
    ],
  },
)
