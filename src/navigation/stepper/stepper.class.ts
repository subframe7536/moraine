import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const stepperRootVariants = cva('flex gap-2', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'flex-col w-full',
      vertical: 'flex-row gap-6 w-full items-start',
    },
  },
})

export const stepperHeaderVariants = cva('flex', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'flex-col gap-4 min-w-0',
    },
  },
})

export const stepperItemVariants = cva('min-w-0 relative data-disabled:effect-dis', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'text-center flex-1 w-full',
      vertical: 'text-start flex gap-$st-gap items-start',
    },
    size: {
      sm: 'var-stepper-8-6-2-0.5',
      md: 'var-stepper-9-7-2.5-1',
      lg: 'var-stepper-10-8-3-1',
    },
  },
})

export const stepperContainerVariants = cva('flex items-center relative', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'justify-center',
      vertical: 'shrink-0 flex-col self-stretch',
    },
  },
})

export const stepperTriggerVariants = cva(
  'rounded-full inline-flex size-$st-size transition-colors items-center justify-center focus-visible:effect-fv data-clickable:cursor-pointer',
  {
    defaultVariants: {
      size: 'md',
      state: 'inactive',
    },
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      state: {
        inactive: 'text-muted-foreground border-input bg-background shadow-xs',
        active: 'text-primary-foreground border-primary bg-primary',
        completed: 'text-primary-foreground border-primary bg-primary',
      },
    },
  },
)

export const stepperSeparatorVariants = cva(
  'rounded-full bg-border bg-border transition-colors absolute data-[state=completed]:bg-primary data-disabled:opacity-75',
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal:
          'h-1.5 end-[calc(-50%+var(--st-sep-x))] start-[calc(50%+var(--st-sep-x))] top-1/2 -translate-y-1/2',
        vertical: 'w-1.5 bottom--3 left-1/2 top-$st-sep-top -translate-x-1/2',
      },
    },
  },
)

export const stepperWrapperVariants = cva('min-w-0', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'mt-$st-gap text-center w-full',
      vertical: 'pt-$st-pt text-start',
    },
  },
})

export const stepperTitleVariants = cva('text-foreground leading-snug font-medium', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
})

export const stepperDescriptionVariants = cva('text-muted-foreground leading-normal text-wrap', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
})

export type StepperVariantProps = VariantProps<typeof stepperItemVariants>
