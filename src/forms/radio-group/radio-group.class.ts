import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { RadioGroupT } from './radio-group.types.ts'

export const radioGroupRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'flex relative',
      'data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
    ),
    item: /* @__PURE__ */ cn(
      'flex items-start data-disabled:opacity-64 data-disabled:pointer-events-none',
      'data-[table-orientation=horizontal]:first-of-type:rounded-s-lg data-[table-orientation=horizontal]:last-of-type:rounded-e-lg data-[table-orientation=vertical]:first-of-type:rounded-t-lg data-[table-orientation=vertical]:last-of-type:rounded-b-lg data-[table-orientation=horizontal]:[&:not(:first-of-type)]:-ms-px data-[table-orientation=vertical]:[&:not(:first-of-type)]:-mt-px',
    ),
    control:
      'outline-none border border-input rounded-full bg-background inline-flex shrink-0 transition-shadow items-center justify-center relative overflow-hidden bg-clip-padding data-checked:text-primary-foreground data-checked:border-primary data-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:bg-input/30 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    container: 'flex items-center',
    indicator: 'rounded-full bg-primary-foreground',
    wrapper: 'flex flex-col gap-0.5 w-full',
    label: 'text-foreground font-medium block',
    description: 'text-muted-foreground leading-normal',
  },
  defaults: {
    variant: 'list',

    size: 'md',
    indicator: 'start',
  },
  variants: {
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
        root: 'gap-2',
        item: 'border border-border rounded-md data-checked:border-primary',
      },
      table: {
        item: 'border border-muted relative data-checked:border-primary/50 data-checked:bg-primary/10 data-checked:z-base',
      },
      list: {
        root: 'gap-2',
      },
    },
    indicator: {
      start: { item: 'flex-row', wrapper: 'ms-2' },
      end: { item: 'flex-row-reverse', wrapper: 'me-2' },
      hidden: { wrapper: '' },
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
} as const satisfies SlotRecipeOptions<keyof RadioGroupT.Slot>

export const radioGroupRecipe = /* @__PURE__ */ slotRecipe(radioGroupRecipeOptions)
