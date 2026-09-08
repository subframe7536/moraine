import { slotRecipe } from '../../shared/style/recipe.ts'
import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { StepperT } from './stepper.types.ts'

export const stepperRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'flex gap-2',
      'data-[orientation=vertical]:flex-row data-[orientation=horizontal]:flex-col data-[orientation=vertical]:gap-6 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-full data-[orientation=vertical]:items-start',
    ),
    header: /* @__PURE__ */ cn(
      'flex',
      'data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-w-0',
    ),
    item: /* @__PURE__ */ cn(
      'min-w-0 relative data-disabled:opacity-64 data-disabled:pointer-events-none',
      'data-[orientation=horizontal]:text-center data-[orientation=vertical]:text-start data-[orientation=vertical]:flex data-[orientation=horizontal]:flex-1 data-[orientation=vertical]:gap-[var(--st-gap)] data-[orientation=horizontal]:w-full data-[orientation=vertical]:items-start',
    ),
    container: /* @__PURE__ */ cn(
      'flex items-center relative',
      'data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:self-stretch data-[orientation=horizontal]:justify-center',
    ),
    trigger:
      'rounded-full inline-flex size-[var(--st-size)] transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-clickable:cursor-pointer data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-input data-[state=inactive]:bg-background data-[state=inactive]:shadow-xs data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=completed]:text-primary-foreground data-[state=completed]:border-primary data-[state=completed]:bg-primary duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
    indicator: '',
    icon: '',
    separator: /* @__PURE__ */ cn(
      'rounded-full bg-border transition-colors duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] absolute data-[state=completed]:bg-primary data-disabled:opacity-75',
      'data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:end-[calc(-50%+var(--st-sep-x))] data-[orientation=horizontal]:start-[calc(50%+var(--st-sep-x))] data-[orientation=horizontal]:top-1/2 data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:top-[var(--st-sep-top)] data-[orientation=horizontal]:-translate-y-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:-bottom-3',
    ),
    wrapper: /* @__PURE__ */ cn(
      'min-w-0',
      'data-[orientation=horizontal]:mt-[var(--st-gap)] data-[orientation=vertical]:pt-[var(--st-pt)] data-[orientation=horizontal]:text-center data-[orientation=vertical]:text-start data-[orientation=horizontal]:w-full',
    ),
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    content: 'w-full',
  },
  defaults: {
    size: 'md',
  },
  variants: {
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

export const stepperRecipe = /* @__PURE__ */ slotRecipe(stepperRecipeOptions)
