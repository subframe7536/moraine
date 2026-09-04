import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const textareaRecipe = recipe({
  slots: ['root', 'header', 'input', 'footer'],
  base: {
    root: 'rounded-md flex flex-col w-full transition-[colors,box-shadow] overflow-hidden data-focused:outline-none data-focused:border-ring data-focused:ring-3 data-focused:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none data-focused:data-invalid:border-destructive data-focused:data-invalid:ring-3 data-focused:data-invalid:ring-destructive/20 dark:data-focused:data-invalid:border-destructive/50 dark:data-focused:data-invalid:ring-destructive/40',
    header: 'text-muted-foreground font-medium flex gap-2 w-full items-center',
    input:
      'placeholder:text-muted-foreground text-foreground outline-none bg-transparent flex-1 min-w-0',
    footer: 'text-muted-foreground font-medium flex gap-2 w-full items-center',
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    autoresize: false,
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs',
        input: 'text-xs leading-4 px-2 py-1 min-h-14',
        header: 'text-xs px-2.5 pb-1 pt-2',
        footer: 'text-xs p-1.5',
      },
      md: {
        root: 'text-sm',
        input: 'text-sm leading-5 px-2.5 py-1.5 min-h-16',
        header: 'text-sm px-2.5 pb-1.5 pt-2',
        footer: 'text-sm p-1.5',
      },
      lg: {
        root: 'text-base',
        input: 'text-base leading-6 px-3 py-2 min-h-18',
        header: 'text-sm px-3 pb-1.5 pt-2.5',
        footer: 'text-sm p-2',
      },
    },
    variant: {
      outline: { root: INPUT_VARIANT.outline },
      subtle: { root: INPUT_VARIANT.subtle },
      ghost: { root: INPUT_VARIANT.ghost },
      none: { root: INPUT_VARIANT.none },
    },
    autoresize: {
      true: { input: 'resize-none' },
      false: { input: 'resize-y' },
    },
  },
})

export type TextareaVariantProps = VariantProps<typeof textareaRecipe>
