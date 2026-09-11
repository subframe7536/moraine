import { slotRecipe } from '../../shared/style/recipe.ts'

import type { StepperT } from './stepper.types.ts'

export const stepperRecipe = /* @__PURE__ */ slotRecipe<StepperT.Slot, StepperT.Variant>({
  base: {
    root: 'flex w-full gap-2',
    list: 'flex min-w-0',
    item: 'relative min-w-0 data-disabled:(opacity-64 pointer-events-none)',
    trigger:
      'relative flex w-full min-w-0 gap-(--st-gap) rounded-md focus-visible:(outline-none ring-3 ring-ring/50) data-clickable:cursor-pointer',
    indicator:
      'relative z-1 inline-flex shrink-0 size-(--st-size) items-center justify-center rounded-full transition-colors data-[state=inactive]:(text-muted-foreground border-input bg-background shadow-xs) data-[state=active]:(text-primary-foreground border-primary bg-primary) data-[state=completed]:(text-primary-foreground border-primary bg-primary)',
    body: 'flex min-w-0 flex-col',
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    separator:
      'pointer-events-none absolute z-0 rounded-full bg-border transition-colors data-[state=completed]:bg-primary data-disabled:opacity-75',
    content: 'w-full min-w-0',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col',
        list: 'w-full flex-row',
        item: 'flex-1',
        trigger: 'flex-col items-center',
        body: 'w-full items-center text-center',
        separator:
          'h-1.5 start-[calc(50%+var(--st-size)/2+var(--st-gap))] end-[calc(-50%+var(--st-size)/2+var(--st-gap))] top-[calc(var(--st-size)/2)] -translate-y-1/2',
      },
      vertical: {
        root: 'flex-row gap-6 items-start',
        list: 'flex-col gap-4',
        trigger: 'flex-row items-start text-start',
        body: 'pt-1 text-start',
        separator:
          'w-1.5 start-[calc(var(--st-size)/2-var(--spacing)*0.75)] top-[calc(var(--st-size)+var(--spacing))] -bottom-3',
      },
    },
    size: {
      sm: {
        '--st-size': 'calc(var(--spacing)*8)',
        '--st-gap': 'calc(var(--spacing)*2)',
        indicator: 'text-xs',
        title: 'text-xs',
        description: 'text-xs',
      },
      md: {
        '--st-size': 'calc(var(--spacing)*9)',
        '--st-gap': 'calc(var(--spacing)*2.5)',
        indicator: 'text-sm',
        title: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        '--st-size': 'calc(var(--spacing)*10)',
        '--st-gap': 'calc(var(--spacing)*3)',
        indicator: 'text-base',
        title: 'text-base',
        description: 'text-base',
      },
    },
  },
  compoundVariants: [{ variants: { orientation: 'vertical', size: 'sm' }, body: 'pt-0.5' }],
})
