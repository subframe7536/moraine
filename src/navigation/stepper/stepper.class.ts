import { slotRecipe } from '../../shared/style/recipe.ts'

import type { StepperT } from './stepper.types.ts'

export const stepperRecipe = /* @__PURE__ */ slotRecipe<StepperT.Slot, StepperT.Variant>({
  base: {
    root: 'flex gap-2',
    header: 'flex',
    item: 'min-w-0 relative data-disabled:(opacity-64 pointer-events-none)',
    container: 'flex items-center relative',
    trigger:
      'rounded-full inline-flex size-(--st-size) transition-colors items-center justify-center focus-visible:(outline-none ring-3 ring-ring/50) data-clickable:cursor-pointer data-[state=inactive]:(text-muted-foreground border-input bg-background shadow-xs) data-[state=active]:(text-primary-foreground border-primary bg-primary) data-[state=completed]:(text-primary-foreground border-primary bg-primary)',
    indicator: '',
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
        separator:
          'h-1.5 end-[calc(-50%+var(--st-sep-x))] start-[calc(50%+var(--st-sep-x))] top-1/2 -translate-y-1/2',
        wrapper: 'mt-(--st-gap) text-center w-full',
      },
      vertical: {
        root: 'flex-row gap-6 w-full items-start',
        header: 'flex-col gap-4 min-w-0',
        item: 'text-start flex gap-(--st-gap) items-start',
        container: 'shrink-0 flex-col self-stretch',
        separator: 'w-1.5 left-1/2 top-(--st-sep-top) -translate-x-1/2 -bottom-3',
        wrapper: 'pt-(--st-pt) text-start',
      },
    },
    size: {
      sm: {
        root: '[--st-size:calc(var(--spacing)*8)] [--st-sep-x:calc(var(--spacing)*6)] [--st-sep-top:calc(var(--spacing)*9)] [--st-gap:calc(var(--spacing)*2)] [--st-pt:calc(var(--spacing)*0.5)]',
        trigger: 'text-xs',
        title: 'text-xs',
        description: 'text-xs',
      },
      md: {
        root: '[--st-size:calc(var(--spacing)*9)] [--st-sep-x:calc(var(--spacing)*7)] [--st-sep-top:calc(var(--spacing)*10)] [--st-gap:calc(var(--spacing)*2.5)] [--st-pt:calc(var(--spacing)*1)]',
        trigger: 'text-sm',
        title: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        root: '[--st-size:calc(var(--spacing)*10)] [--st-sep-x:calc(var(--spacing)*8)] [--st-sep-top:calc(var(--spacing)*11)] [--st-gap:calc(var(--spacing)*3)] [--st-pt:calc(var(--spacing)*1)]',
        trigger: 'text-base',
        title: 'text-base',
        description: 'text-base',
      },
    },
  },
})
