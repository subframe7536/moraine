import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { FormFieldT } from './form-field.types.ts'

export const formFieldRecipeOptions = {
  base: {
    root: '',
    wrapper: 'flex flex-col gap-1',
    labelWrapper: 'flex gap-1.5 items-center',
    label: 'text-foreground font-medium block',
    container: 'flex flex-col gap-1.5 relative',
    description: 'text-muted-foreground leading-normal',
    error: 'text-destructive font-medium leading-normal',
    hint: 'text-muted-foreground',
    help: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    size: 'md',
    orientation: 'vertical',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs',
        description: 'text-xs leading-normal',
        error: 'text-xs leading-normal',
        hint: 'text-xs',
        help: 'text-xs leading-normal',
      },
      md: {
        root: 'text-sm',
        description: 'text-sm leading-normal',
        error: 'text-sm leading-normal',
        hint: 'text-sm',
        help: 'text-sm leading-normal',
      },
      lg: {
        root: 'text-base',
        description: 'text-base leading-normal',
        error: 'text-base leading-normal',
        hint: 'text-base',
        help: 'text-base leading-normal',
      },
    },
    orientation: {
      vertical: {
        labelWrapper: 'justify-between',
      },
      horizontal: {
        root: 'gap-x-2 grid grid-cols-4 items-baseline',
        wrapper: 'text-end col-span-1 items-end',
        labelWrapper: 'justify-end',
        container: 'col-span-3 min-w-0',
      },
    },
    required: {
      true: {
        label: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
      false: {},
    },
    hasText: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        orientation: 'horizontal',
        required: true,
      },
      class: {
        label: "before:text-destructive before:me-0.5 before:content-['*'] after:content-none",
      },
    },
    {
      variants: {
        orientation: 'vertical',
        hasText: true,
      },
      class: {
        container: 'mt-1.5',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof FormFieldT.Slot>

export const formFieldRecipe = recipe(formFieldRecipeOptions)

export type FormFieldVariantProps = FormFieldT.Variant
