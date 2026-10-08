import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { StepperStyleSlot, StepperStyleVariant } from './stepper.style-types'

export const stepperDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes('disabled', 'state'),
  trigger: /* @__PURE__ */ createDataAttributes('clickable', 'selected', 'state'),
  indicator: /* @__PURE__ */ createDataAttributes('state'),
  separator: /* @__PURE__ */ createDataAttributes('disabled', 'state'),
  content: /* @__PURE__ */ createDataAttributes('selected'),
} satisfies DataAttributeContract<keyof StepperStyleSlot>

export const stepperRecipe = /* @__PURE__ */ defineRecipe<StepperStyleSlot, StepperStyleVariant>(
  'stepper',
  {
    base: {
      root: 'flex gap-2',
      header: 'flex min-w-0',
      item: `min-w-0 relative ${DATA_DISABLED_CLASS}`,
      trigger: `text-start rounded-md inline-flex min-w-0 items-center ${FOCUS_VISIBLE_RING_CLASS} data-clickable:cursor-pointer`,
      indicator:
        'rounded-full inline-flex shrink-0 transition-colors items-center justify-center data-[state=active]:(text-primary-foreground border-primary bg-primary) data-[state=completed]:(text-primary-foreground border-primary bg-primary) data-[state=inactive]:(text-muted-foreground border-input bg-background shadow-surface)',
      icon: '',
      separator:
        'rounded-full bg-border transition-colors data-[state=completed]:bg-primary data-disabled:opacity-75',
      wrapper: 'flex flex-col min-w-0',
      title: 'text-foreground leading-snug font-medium',
      description: 'text-muted-foreground leading-normal text-wrap',
      content: 'min-w-0 w-full',
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
    variants: {
      orientation: {
        horizontal: {
          root: 'flex-col w-full',
          header: 'p-1 gap-3 w-full overflow-x-auto',
          item: 'flex flex-1 gap-3 min-w-min items-center last:flex-none',
          separator: 'flex-1 h-px min-w-4',
        },
        vertical: {
          root: 'flex-row gap-6 w-full items-start',
          header: 'flex-col',
          item: 'not-last:pb-6',
          trigger: 'items-start',
          separator: 'w-px bottom-1 absolute -translate-x-1/2 rtl:translate-x-1/2',
        },
      },
      size: {
        sm: {
          trigger: 'gap-2',
          indicator: 'text-xs size-8',
          title: 'text-xs',
          description: 'text-xs',
        },
        md: {
          trigger: 'gap-2.5',
          indicator: 'text-sm size-9',
          title: 'text-sm',
          description: 'text-sm',
        },
        lg: {
          trigger: 'gap-3',
          indicator: 'text-base size-10',
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
  },
)
