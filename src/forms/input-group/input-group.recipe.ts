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
        leading: '',
        trailing: '',
      },
      vertical: {
        leading: 'w-full',
        trailing: 'w-full',
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
      leading: 'px-1.5 data-compact:px-0.5',
      trailing: 'px-1.5 data-compact:px-0.5',
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      leading: 'px-2 data-compact:px-1',
      trailing: 'px-2 data-compact:px-1',
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      leading: 'px-2.5 data-compact:px-1.5',
      trailing: 'px-2.5 data-compact:px-1.5',
    },
    {
      variants: { orientation: 'vertical', size: 'sm' },
      leading: 'p-1.5 data-compact:p-0.5',
      trailing: 'p-1.5 data-compact:p-0.5',
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      leading: 'p-2 data-compact:p-1',
      trailing: 'p-2 data-compact:p-1',
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      leading: 'p-2.5 data-compact:p-1.5',
      trailing: 'p-2.5 data-compact:p-1.5',
    },
  ],
})
