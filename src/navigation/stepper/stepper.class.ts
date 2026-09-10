import { slotRecipe } from '../../shared/style/recipe'

import type { StepperT } from './stepper.types'

export const stepperRecipe = /* @__PURE__ */ slotRecipe<StepperT.Slot, StepperT.Variant>({
  base: {
    root: 'flex gap-2',
    header: 'flex',
    item: 'min-w-0 relative data-disabled:(opacity-64 pointer-events-none)',
    container: 'flex items-center relative',
    trigger:
      'rounded-full inline-flex transition-colors items-center justify-center focus-visible:(outline-none ring-3 ring-ring/50) data-clickable:cursor-pointer data-[state=inactive]:(text-muted-foreground border-input bg-background shadow-xs) data-[state=active]:(text-primary-foreground border-primary bg-primary) data-[state=completed]:(text-primary-foreground border-primary bg-primary)',
    indicator: 'inline-flex items-center justify-center size-full',
    icon: '',
    separator:
      'rounded-full bg-border transition-colors absolute data-[state=completed]:bg-primary data-disabled:opacity-75',
    wrapper: 'min-w-0',
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    content: 'w-full',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col w-full',
        header: 'w-full',
        item: 'text-center flex-1 w-full',
        container: 'justify-center',
        separator: 'h-1.5 top-1/2 -translate-y-1/2',
        wrapper: 'mt-2 text-center w-full',
      },
      vertical: {
        root: 'flex-row gap-6 w-full items-start',
        header: 'flex-col gap-4 min-w-0',
        item: 'text-start flex gap-2.5 items-start',
        container: 'shrink-0 flex-col self-stretch',
        separator: 'w-1.5 left-1/2 -translate-x-1/2 -bottom-3',
        wrapper: 'pt-1 text-start',
      },
    },
    size: {
      sm: {
        trigger: 'size-8 text-xs',
        title: 'text-xs',
        description: 'text-xs',
      },
      md: {
        trigger: 'size-9 text-sm',
        title: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        trigger: 'size-10 text-base',
        title: 'text-base',
        description: 'text-base',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm' },
      class: {
        separator: 'start-[calc(50%+24px)] end-[calc(-50%+24px)]',
      },
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      class: {
        separator: 'start-[calc(50%+28px)] end-[calc(-50%+28px)]',
      },
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      class: {
        separator: 'start-[calc(50%+32px)] end-[calc(-50%+32px)]',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'sm' },
      class: {
        separator: 'top-9',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'md' },
      class: {
        separator: 'top-10',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'lg' },
      class: {
        separator: 'top-11',
      },
    },
  ],
})
