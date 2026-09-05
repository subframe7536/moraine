import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const inputRecipe = recipe({
  base: {
    root: 'inline-flex w-full cursor-text transition-[colors,box-shadow] items-center overflow-hidden focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40',
    input:
      'placeholder:text-muted-foreground text-foreground outline-none flex-1 h-full min-w-0 disabled:opacity-64 disabled:pointer-events-none',
    leading: 'flex shrink-0 items-center',
    trailing: 'flex shrink-0 items-center',
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
})

export type InputVariantProps = VariantProps<typeof inputRecipe>
