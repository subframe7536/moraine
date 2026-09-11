import { slotRecipe } from '../../shared/style/recipe.ts'

import type { StepperT } from './stepper.types.ts'

export const stepperRecipe = /* @__PURE__ */ slotRecipe<StepperT.Slot, StepperT.Variant>({
  base: {
    root: 'flex gap-2',
    header: 'flex min-w-0',
    item: 'min-w-0 relative data-disabled:(opacity-64 pointer-events-none)',
    trigger:
      'rounded-md inline-flex min-w-0 items-center text-start focus-visible:(outline-none ring-3 ring-ring/50) data-clickable:cursor-pointer',
    indicator:
      'inline-flex shrink-0 items-center justify-center rounded-full transition-colors data-[state=inactive]:(text-muted-foreground border-input bg-background shadow-xs) data-[state=active]:(text-primary-foreground border-primary bg-primary) data-[state=completed]:(text-primary-foreground border-primary bg-primary)',
    icon: '',
    separator:
      'rounded-full bg-border transition-colors data-[state=completed]:bg-primary data-disabled:opacity-75',
    wrapper: 'flex flex-col min-w-0',
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    content: 'w-full min-w-0',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col w-full',
        header: 'w-full gap-3 overflow-x-auto p-1',
        item: 'flex flex-1 min-w-min items-center gap-3 last:flex-none',
        separator: 'h-px min-w-4 flex-1',
      },
      vertical: {
        root: 'flex-row gap-6 w-full items-start',
        header: 'flex-col',
        item: 'not-last:pb-6',
        trigger: 'items-start',
        separator: 'absolute w-px bottom-1 -translate-x-1/2 rtl:translate-x-1/2',
      },
    },
    size: {
      sm: {
        trigger: 'gap-2',
        indicator: 'size-8 text-xs',
        title: 'text-xs',
        description: 'text-xs',
      },
      md: {
        trigger: 'gap-2.5',
        indicator: 'size-9 text-sm',
        title: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        trigger: 'gap-3',
        indicator: 'size-10 text-base',
        title: 'text-base',
        description: 'text-base',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'vertical', size: 'sm' },
      separator: 'start-4 top-9',
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      separator: 'start-4.5 top-10',
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      separator: 'start-5 top-11',
    },
  ],
})
