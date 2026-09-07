import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import type { SlotRecipeOptions, VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { InputT } from './input.types.ts'

export const inputRecipeOptions = {
  base: {
    root: 'inline-flex w-full cursor-text transition-[colors,box-shadow] items-center overflow-hidden focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    input:
      'placeholder:text-muted-foreground text-foreground outline-none flex-1 h-full min-w-0 disabled:opacity-64 disabled:pointer-events-none [&[type=file]]:text-muted-foreground file:font-medium file:me-1.5 file:outline-none',
    leading: 'flex shrink-0 items-center [&_[data-loading]]:animate-spin',
    trailing: 'flex shrink-0 items-center [&_[data-loading]]:animate-spin',
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs rounded-sm h-7',
        input: 'leading-4 px-1.5 py-1',
        leading: 'ps-2 gap-1',
        trailing: 'pe-2 gap-1',
      },
      md: {
        root: 'text-sm rounded-md h-8',
        input: 'leading-5 px-2 py-1.5',
        leading: 'ps-2.5 gap-1.5',
        trailing: 'pe-2.5 gap-1.5',
      },
      lg: {
        root: 'text-base rounded-lg h-9',
        input: 'leading-6 px-2.5 py-2',
        leading: 'ps-3 gap-2',
        trailing: 'pe-3 gap-2',
      },
    },
    variant: {
      outline: { root: INPUT_VARIANT.outline },
      subtle: { root: INPUT_VARIANT.subtle },
      ghost: { root: INPUT_VARIANT.ghost },
      none: { root: INPUT_VARIANT.none },
    },
  },
} as const satisfies SlotRecipeOptions<keyof InputT.Slot>

export const inputRecipe = recipe(inputRecipeOptions)

export type InputVariantProps = VariantProps<typeof inputRecipe>
