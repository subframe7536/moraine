import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'

import type { StepperT } from './stepper.types.ts'

export const stepperRecipeOptions = {
  base: {
    root: 'flex gap-2',
    header: 'flex',
    item: 'min-w-0 relative data-disabled:opacity-64 data-disabled:pointer-events-none',
    container: 'flex items-center relative',
    trigger:
      'rounded-full inline-flex size-[var(--st-size)] transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-clickable:cursor-pointer data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-input data-[state=inactive]:bg-background data-[state=inactive]:shadow-xs data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=completed]:text-primary-foreground data-[state=completed]:border-primary data-[state=completed]:bg-primary duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    indicator: '',
    icon: '',
    separator:
      'rounded-full bg-border transition-colors absolute data-[state=completed]:bg-primary data-disabled:opacity-75 duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    wrapper: 'min-w-0',
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    content: 'w-full',
  },
  defaultVariants: {
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
        wrapper: 'mt-[var(--st-gap)] text-center w-full',
      },
      vertical: {
        root: 'flex-row gap-6 w-full items-start',
        header: 'flex-col gap-4 min-w-0',
        item: 'text-start flex gap-[var(--st-gap)] items-start',
        container: 'shrink-0 flex-col self-stretch',
        separator: 'w-1.5 -bottom-3 left-1/2 top-[var(--st-sep-top)] -translate-x-1/2',
        wrapper: 'pt-[var(--st-pt)] text-start',
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
} as const satisfies SlotRecipeOptions<keyof StepperT.Slot>
