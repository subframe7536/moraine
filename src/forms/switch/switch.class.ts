import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const switchRecipe = recipe({
  slots: ['root', 'track', 'thumb', 'icon', 'wrapper', 'label', 'description'],
  base: {
    root: 'flex flex-row items-start',
    track:
      'p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-xs transition-[color,background-color,box-shadow] items-center focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80',
    thumb:
      'rounded-full bg-background flex pointer-events-none shadow-sm transition-transform items-center justify-center relative',
    icon: '',
    wrapper: 'flex flex-col gap-0.5',
    label: '',
    description: '',
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
      },
      md: {
        track: 'h-4.5 w-8',
        thumb: 'size-3.5 data-checked:translate-x-3.5',
        wrapper: 'text-sm ms-2',
      },
      lg: {
        track: 'h-5.5 w-10',
        thumb: 'size-4.5 data-checked:translate-x-4.5',
        wrapper: 'text-base ms-2.5',
      },
    },
  },
})

export type SwitchVariantProps = VariantProps<typeof switchRecipe>
