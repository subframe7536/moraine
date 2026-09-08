import { slotRecipe } from '../../shared/style/recipe.ts'

import type { CheckboxT } from './checkbox.types.ts'

export const checkboxRecipe = /* @__PURE__ */ slotRecipe<keyof CheckboxT.Slot>({
  base: {
    root: 'flex items-start relative',
    control:
      'disabled:(opacity-64 pointer-events-none) outline-none border border-input rounded-xs bg-background inline-flex shrink-0 cursor-pointer shadow-xs transition-shadow items-center justify-center overflow-hidden bg-clip-padding focus-visible:(outline-none border-ring ring-3 ring-ring/50) data-checked:(border-primary bg-primary) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:data-invalid:(border-destructive/50 ring-destructive/40) dark:bg-input/30',
    indicator: 'text-primary-foreground bg-primary flex size-full items-center justify-center',
    icon: 'shrink-0 size-full',
    wrapper: 'flex flex-col gap-0.5 w-full',
    container: 'flex items-center',
    label:
      "text-foreground font-medium block select-none data-required:after:(text-destructive ms-0.5 content-['*'])",
    description: 'text-muted-foreground leading-normal',
  },
  defaults: {
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
