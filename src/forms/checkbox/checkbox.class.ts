import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const checkboxRecipe = recipe({
  base: {
    root: 'flex items-start relative',
    control:
      'outline-none border border-input rounded-xs bg-background inline-flex shrink-0 cursor-pointer shadow-xs transition-shadow items-center justify-center overflow-hidden bg-clip-padding focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30',
    indicator: 'text-primary-foreground bg-primary flex size-full items-center justify-center',
    icon: 'shrink-0 size-full',
    wrapper: 'flex flex-col gap-0.5 w-full',
    container: 'flex items-center',
    label: 'text-foreground font-medium block select-none',
    description: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    size: 'md',
    indicator: 'start',
  },
  variants: {
    variant: {
      card: { root: 'border border-border rounded-md cursor-pointer' },
      list: {},
    },
    indicator: {
      start: { root: 'flex-row', wrapper: 'ms-2' },
      end: { root: 'flex-row-reverse', wrapper: 'me-2' },
      hidden: { wrapper: '' },
    },
    size: {
      sm: {
        control: 'size-3.5',
        container: 'h-4',
        wrapper: 'text-xs',
        description: 'text-xs leading-normal',
      },
      md: {
        control: 'size-4',
        container: 'h-5',
        wrapper: 'text-sm',
        description: 'text-sm leading-normal',
      },
      lg: {
        control: 'size-4.5',
        container: 'h-6',
        wrapper: 'text-base',
        description: 'text-base leading-normal',
      },
    },
    required: {
      true: {
        label: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'card', size: 'sm' },
      class: { root: 'p-3' },
    },
    {
      variants: { variant: 'card', size: 'md' },
      class: { root: 'p-3.5' },
    },
    {
      variants: { variant: 'card', size: 'lg' },
      class: { root: 'p-4' },
    },
  ],
})

export type CheckboxVariantProps = VariantProps<typeof checkboxRecipe>
