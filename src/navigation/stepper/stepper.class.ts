import { defineStyleVars } from '../../shared/style/css-vars.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const STEPPER_TRIGGER_STATE_CLASS = {
  inactive: 'text-muted-foreground border-input bg-background shadow-xs',
  active: 'text-primary-foreground border-primary bg-primary',
  completed: 'text-primary-foreground border-primary bg-primary',
} as const

export const stepperStyleVars = defineStyleVars({
  prefix: 'st',
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        size: 'calc(var(--spacing) * 8)',
        'sep-x': 'calc(var(--spacing) * 6)',
        'sep-top': 'calc(var(--spacing) * 9)',
        gap: 'calc(var(--spacing) * 2)',
        pt: 'calc(var(--spacing) * 0.5)',
      },
      md: {
        size: 'calc(var(--spacing) * 9)',
        'sep-x': 'calc(var(--spacing) * 7)',
        'sep-top': 'calc(var(--spacing) * 10)',
        gap: 'calc(var(--spacing) * 2.5)',
        pt: 'calc(var(--spacing) * 1)',
      },
      lg: {
        size: 'calc(var(--spacing) * 10)',
        'sep-x': 'calc(var(--spacing) * 8)',
        'sep-top': 'calc(var(--spacing) * 11)',
        gap: 'calc(var(--spacing) * 3)',
        pt: 'calc(var(--spacing) * 1)',
      },
    },
  },
})

export const stepperRecipe = recipe({
  slots: [
    'root',
    'header',
    'item',
    'container',
    'trigger',
    'indicator',
    'icon',
    'separator',
    'wrapper',
    'title',
    'description',
    'content',
  ],
  base: {
    root: 'flex gap-2',
    header: 'flex',
    item: 'min-w-0 relative data-disabled:opacity-64 data-disabled:pointer-events-none',
    container: 'flex items-center relative',
    trigger:
      'rounded-full inline-flex size-[var(--st-size)] transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-clickable:cursor-pointer',
    indicator: '',
    icon: '',
    separator:
      'rounded-full bg-border bg-border transition-colors absolute data-[state=completed]:bg-primary data-disabled:opacity-75',
    wrapper: 'min-w-0',
    title: 'text-foreground leading-snug font-medium',
    description: 'text-muted-foreground leading-normal text-wrap',
    content: '',
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
        separator: 'w-1.5 bottom--3 left-1/2 top-[var(--st-sep-top)] -translate-x-1/2',
        wrapper: 'pt-[var(--st-pt)] text-start',
      },
    },
    size: {
      sm: {
        trigger: 'text-xs',
        title: 'text-xs',
        description: 'text-xs',
      },
      md: {
        trigger: 'text-sm',
        title: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        trigger: 'text-base',
        title: 'text-base',
        description: 'text-base',
      },
    },
  },
})

export type StepperVariantProps = VariantProps<typeof stepperRecipe>
