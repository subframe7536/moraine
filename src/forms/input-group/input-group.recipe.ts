import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'

import type { InputGroupStyleSlot, InputGroupRecipeVariant } from './input-group.style-types'

export const inputGroupRecipe = /* @__PURE__ */ defineRecipe<
  InputGroupStyleSlot,
  InputGroupRecipeVariant
>('inputGroup', {
  base: {
    root: 'relative flex flex-wrap w-full items-center cursor-text transition-[colors,box-shadow]',
    leading: 'flex shrink-0 items-center text-muted-foreground',
    trailing: 'flex shrink-0 items-center text-muted-foreground',
    frame:
      'absolute pointer-events-none transition-[colors,box-shadow] peer-focus:(border-ring ring-3 ring-ring/50) peer-aria-invalid:(border-destructive ring-3 ring-destructive/20) dark:peer-aria-invalid:(border-destructive/50 ring-destructive/40)',
  },
  defaultVariants: { size: 'md', variant: 'outline', orientation: 'horizontal', compact: false },
  variants: {
    size: {
      sm: {
        root: 'text-xs rounded-sm min-h-7',
        leading: 'gap-1',
        trailing: 'gap-1',
        frame: 'rounded-sm',
      },
      md: {
        root: 'text-sm rounded-md min-h-8',
        leading: 'gap-1.5',
        trailing: 'gap-1.5',
        frame: 'rounded-md',
      },
      lg: {
        root: 'text-base rounded-lg min-h-9',
        leading: 'gap-2',
        trailing: 'gap-2',
        frame: 'rounded-lg',
      },
    },
    orientation: {
      horizontal: {
        leading: 'data-compact:pe-0',
        trailing: 'data-compact:ps-0',
      },
      vertical: {
        leading: 'w-full data-compact:pb-0',
        trailing: 'w-full data-compact:pt-0',
      },
    },
    variant: {
      outline: {
        root: INPUT_VARIANT.outline,
        frame: '-inset-px border border-transparent',
      },
      subtle: {
        root: INPUT_VARIANT.subtle,
        frame: '-inset-px border border-transparent',
      },
      ghost: { root: INPUT_VARIANT.ghost, frame: 'inset-0' },
      none: {
        frame: 'inset-0 peer-focus:ring-0',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm' },
      leading: 'first:ps-1.5 pe-1.5',
      trailing: '[&:nth-last-child(2)]:pe-1.5 ps-1.5',
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      leading: 'first:ps-2 pe-2',
      trailing: '[&:nth-last-child(2)]:pe-2 ps-2',
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      leading: 'first:ps-2.5 pe-2.5',
      trailing: '[&:nth-last-child(2)]:pe-2.5 ps-2.5',
    },
    {
      variants: { orientation: 'vertical', size: 'sm' },
      leading: 'first:pt-1 px-1.5 pb-1',
      trailing: '[&:nth-last-child(2)]:pb-1 px-1.5 pt-1',
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      leading: 'first:pt-1.5 px-2 pb-1.5',
      trailing: '[&:nth-last-child(2)]:pb-1.5 px-2 pt-1.5',
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      leading: 'first:pt-2 px-2.5 pb-2',
      trailing: '[&:nth-last-child(2)]:pb-2 px-2.5 pt-2',
    },
  ],
})
