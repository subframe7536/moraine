import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

import type { TextareaT } from './textarea.types.ts'

export const textareaRecipe = /* @__PURE__ */ slotRecipe<keyof TextareaT.Slot>({
  base: {
    root: 'rounded-md flex flex-col w-full transition-[colors,box-shadow] overflow-hidden data-focused:(outline-none border-ring ring-3 ring-ring/50) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:data-invalid:(border-destructive/50 ring-destructive/40) data-disabled:(opacity-64 pointer-events-none) data-focused:data-invalid:(border-destructive ring-3 ring-destructive/20) dark:data-focused:data-invalid:(border-destructive/50 ring-destructive/40)',
    header: 'text-muted-foreground font-medium flex gap-2 w-full items-center',
    input:
      'text-foreground outline-none bg-transparent flex-1 min-w-0 placeholder:text-muted-foreground [&:not([data-autoresize])]:resize-y data-autoresize:resize-none',
    footer: 'text-muted-foreground font-medium flex gap-2 w-full items-center',
  },
  defaults: {
    size: 'md',
    variant: 'outline',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs',
        input: 'text-xs leading-4 px-1.5 py-1 min-h-14',
        header: 'text-xs px-1.5 pb-1 pt-1.5',
        footer: 'text-xs px-1.5 py-1',
      },
      md: {
        root: 'text-sm',
        input: 'text-sm leading-5 px-2 py-1.5 min-h-16',
        header: 'text-sm px-2 pb-1.5 pt-2',
        footer: 'text-sm px-2 py-1.5',
      },
      lg: {
        root: 'text-base',
        input: 'text-base leading-6 px-2.5 py-2 min-h-18',
        header: 'text-sm px-2.5 pb-1.5 pt-2.5',
        footer: 'text-sm px-2.5 py-2',
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
