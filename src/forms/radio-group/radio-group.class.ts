import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const radioGroupRecipe = recipe({
  base: {
    root: 'flex relative',
    item: 'flex items-start data-disabled:opacity-64 data-disabled:pointer-events-none',
    control:
      'outline-none border border-input rounded-full bg-background inline-flex shrink-0 transition-shadow items-center justify-center relative overflow-hidden bg-clip-padding data-checked:text-primary-foreground data-checked:border-primary data-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30',
    container: 'flex items-center',
    indicator: 'rounded-full bg-primary-foreground',
    wrapper: 'flex flex-col gap-0.5 w-full',
    label: 'text-foreground font-medium block',
    description: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    orientation: 'vertical',
    size: 'md',
    indicator: 'start',
  },
  variants: {
    orientation: {
      horizontal: { root: 'flex-row' },
      vertical: { root: 'flex-col' },
    },
    size: {
      sm: {
        item: 'text-xs',
        control: 'size-3.5',
        container: 'h-4',
        indicator: 'size-1.5',
        description: 'text-xs leading-normal',
      },
      md: {
        item: 'text-sm',
        control: 'size-4',
        container: 'h-5',
        indicator: 'size-2',
        description: 'text-sm leading-normal',
      },
      lg: {
        item: 'text-base',
        control: 'size-4.5',
        container: 'h-6',
        indicator: 'size-2.5',
        description: 'text-base leading-normal',
      },
    },
    variant: {
      card: {
        item: 'border border-border rounded-md data-checked:border-primary',
      },
      table: {
        item: 'border border-muted relative data-checked:border-primary/50 data-checked:bg-primary/10 data-checked:z-base',
      },
      list: {},
    },
    indicator: {
      start: { item: 'flex-row', wrapper: 'ms-2' },
      end: { item: 'flex-row-reverse', wrapper: 'me-2' },
      hidden: { wrapper: '' },
    },
    tableOrientation: {
      horizontal: {
        item: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg [&:not(:first-of-type)]:-ms-px',
      },
      vertical: {
        item: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg [&:not(:first-of-type)]:-mt-px',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'card', size: 'sm' },
      class: { item: 'p-3' },
    },
    {
      variants: { variant: 'card', size: 'md' },
      class: { item: 'p-3.5' },
    },
    {
      variants: { variant: 'card', size: 'lg' },
      class: { item: 'p-4' },
    },
    {
      variants: { variant: 'table', size: 'sm' },
      class: { item: 'p-3' },
    },
    {
      variants: { variant: 'table', size: 'md' },
      class: { item: 'p-3.5' },
    },
    {
      variants: { variant: 'table', size: 'lg' },
      class: { item: 'p-4' },
    },
  ],
})

export type RadioGroupVariantProps = VariantProps<typeof radioGroupRecipe>
