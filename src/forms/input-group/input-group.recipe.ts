import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { defineRecipe } from '../../theme/style/recipe.ts'

import type { InputGroupStyleSlot, InputGroupRecipeVariant } from './input-group.style-types'

export const inputGroupRecipe = /* @__PURE__ */ defineRecipe<
  InputGroupStyleSlot,
  InputGroupRecipeVariant
>('inputGroup', {
  base: {
    root: 'flex flex-wrap w-full items-center overflow-hidden cursor-text transition-[colors,box-shadow] [&:has(>input:focus)]:border-ring [&:has(>textarea:focus)]:border-ring [&:has(>input:focus)]:ring-3 [&:has(>textarea:focus)]:ring-3 [&:has(>input:focus)]:ring-ring/50 [&:has(>textarea:focus)]:ring-ring/50 [&:has(>input[aria-invalid=true])]:border-destructive [&:has(>textarea[aria-invalid=true])]:border-destructive [&:has(>input[aria-invalid=true])]:ring-3 [&:has(>textarea[aria-invalid=true])]:ring-3 [&:has(>input[aria-invalid=true])]:ring-destructive/20 [&:has(>textarea[aria-invalid=true])]:ring-destructive/20 dark:[&:has(>input[aria-invalid=true])]:border-destructive/50 dark:[&:has(>textarea[aria-invalid=true])]:border-destructive/50 dark:[&:has(>input[aria-invalid=true])]:ring-destructive/40 dark:[&:has(>textarea[aria-invalid=true])]:ring-destructive/40 [&:has(>input:disabled)]:opacity-64 [&:has(>textarea:disabled)]:opacity-64',
    leading: 'flex shrink-0 items-center text-muted-foreground',
    trailing: 'flex shrink-0 items-center text-muted-foreground',
  },
  defaultVariants: { size: 'md', variant: 'outline', orientation: 'horizontal', compact: false },
  variants: {
    size: {
      sm: { root: 'text-xs rounded-sm min-h-7', leading: 'gap-1', trailing: 'gap-1' },
      md: { root: 'text-sm rounded-md min-h-8', leading: 'gap-1.5', trailing: 'gap-1.5' },
      lg: { root: 'text-base rounded-lg min-h-9', leading: 'gap-2', trailing: 'gap-2' },
    },
    orientation: {
      horizontal: {
        leading:
          'first:ps-2 data-compact:pe-0 has-[>button]:first:ps-1 has-[>button]:pe-0 has-[>kbd]:first:ps-1.5 has-[>kbd]:pe-0',
        trailing:
          'last:pe-2 data-compact:ps-0 has-[>button]:last:pe-1 has-[>button]:ps-0 has-[>kbd]:last:pe-1.5 has-[>kbd]:ps-0',
      },
      vertical: {
        leading: 'w-full first:pt-1.5 data-compact:pb-0',
        trailing: 'w-full last:pb-1.5 data-compact:pt-0',
      },
    },
    variant: {
      outline: { root: INPUT_VARIANT.outline },
      subtle: { root: INPUT_VARIANT.subtle },
      ghost: { root: INPUT_VARIANT.ghost },
      none: {
        root: '[&:has(>input:focus)]:ring-0 [&:has(>textarea:focus)]:ring-0',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm' },
      leading: 'first:ps-1.5 pe-1.5',
      trailing: 'last:pe-1.5 ps-1.5',
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      leading: 'first:ps-2 pe-2',
      trailing: 'last:pe-2 ps-2',
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      leading: 'first:ps-2.5 pe-2.5',
      trailing: 'last:pe-2.5 ps-2.5',
    },
    {
      variants: { orientation: 'vertical', size: 'sm' },
      leading: 'first:pt-1 px-1.5 pb-1',
      trailing: 'last:pb-1 px-1.5 pt-1',
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      leading: 'first:pt-1.5 px-2 pb-1.5',
      trailing: 'last:pb-1.5 px-2 pt-1.5',
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      leading: 'first:pt-2 px-2.5 pb-2',
      trailing: 'last:pb-2 px-2.5 pt-2',
    },
  ],
})
