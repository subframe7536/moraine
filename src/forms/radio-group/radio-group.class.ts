import type { VariantProps } from 'cls-variant'

import {
  CHECKABLE_BASE_SIZE_VARIANT,
  CHECKABLE_CONTAINER_SIZE_VARIANT,
  CHECKABLE_INDICATOR_VARIANT,
  CHECKABLE_WRAPPER_ALIGN_VARIANT,
  FLEX_ORIENTATION_VARIANT,
  TABLE_EDGE_ORIENTATION_VARIANT,
  TEXT_SIZE_VARIANT,
} from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const radioGroupRootVariants = cva('flex relative', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: FLEX_ORIENTATION_VARIANT,
  },
})

export const radioGroupContainerVariants = cva('flex items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: CHECKABLE_CONTAINER_SIZE_VARIANT,
  },
})

export const radioGroupItemVariants = cva('flex items-start data-disabled:effect-dis', {
  defaultVariants: {
    size: 'md',
    indicator: 'start',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
    variant: {
      card: 'border border-border rounded-md data-checked:border-primary',
      table: 'border border-muted relative data-checked:(border-primary/50 bg-primary/10 z-base)',
    },
    indicator: CHECKABLE_INDICATOR_VARIANT,
    tableOrientation: TABLE_EDGE_ORIENTATION_VARIANT,
  },
  compoundVariants: [
    {
      variant: 'card',
      size: 'sm',
      class: 'p-3',
    },
    {
      variant: 'card',
      size: 'md',
      class: 'p-3.5',
    },
    {
      variant: 'card',
      size: 'lg',
      class: 'p-4',
    },
    {
      variant: 'table',
      size: 'sm',
      class: 'p-3',
    },
    {
      variant: 'table',
      size: 'md',
      class: 'p-3.5',
    },
    {
      variant: 'table',
      size: 'lg',
      class: 'p-4',
    },
  ],
})

export const radioGroupBaseVariants = cva(
  'outline-none border border-input rounded-full bg-background inline-flex shrink-0 transition-shadow items-center justify-center relative overflow-hidden bg-clip-padding data-checked:(text-primary-foreground border-primary bg-primary) peer-focus-visible:effect-fv-border data-invalid:effect-invalid dark:bg-input/30',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: CHECKABLE_BASE_SIZE_VARIANT,
    },
  },
)

export const radioGroupWrapperVariants = cva('w-full', {
  defaultVariants: {
    indicator: 'start',
  },
  variants: {
    indicator: CHECKABLE_WRAPPER_ALIGN_VARIANT,
  },
})

export const radioGroupIndicatorVariants = cva('rounded-full bg-primary-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'size-1.5',
      md: 'size-2',
      lg: 'size-2.5',
    },
  },
})

type RadioGroupItemVariant = 'list' | 'card' | 'table'
type RadioGroupItemIndicator = 'start' | 'end' | 'hidden'
type RadioGroupItemVariantProps = Omit<
  VariantProps<typeof radioGroupItemVariants>,
  'variant' | 'indicator' | 'tableOrientation'
>

export type RadioGroupVariantProps = VariantProps<typeof radioGroupRootVariants> &
  RadioGroupItemVariantProps & {
    variant?: RadioGroupItemVariant
    indicator?: RadioGroupItemIndicator
  }
