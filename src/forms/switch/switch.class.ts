import type { SlotRecipeOptions, VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { SwitchT } from './switch.types.ts'

export const switchRecipeOptions = {
  base: {
    root: 'flex flex-row items-start',
    track:
      'data-disabled:opacity-64 data-disabled:pointer-events-none p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-xs transition-[color,background-color,box-shadow] items-center focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    thumb:
      'rounded-full bg-background flex pointer-events-none shadow-sm transition-transform items-center justify-center relative duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    icon: 'text-primary size-4/5 transition-opacity absolute data-unchecked:text-muted-foreground data-checked:opacity-100 data-unchecked:opacity-90 data-loading:animate-spin duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    wrapper: 'flex flex-col gap-0.5',
    label:
      "text-foreground leading-tight font-medium block cursor-pointer select-none data-required:after:text-destructive data-required:after:ms-0.5 data-required:after:content-['*']",
    description: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        track: 'h-4 w-7',
        thumb: 'size-3 data-checked:translate-x-3',
        wrapper: 'text-xs ms-1.5',
        description: 'text-xs',
      },
      md: {
        track: 'h-4.5 w-8',
        thumb: 'size-3.5 data-checked:translate-x-3.5',
        wrapper: 'text-sm ms-2',
        description: 'text-sm',
      },
      lg: {
        track: 'h-5.5 w-10',
        thumb: 'size-4.5 data-checked:translate-x-4.5',
        wrapper: 'text-base ms-2.5',
        description: 'text-base',
      },
    },
  },
} as const satisfies SlotRecipeOptions<keyof SwitchT.Slot>

export const switchRecipe = recipe(switchRecipeOptions)

export type SwitchVariantProps = VariantProps<typeof switchRecipe>
