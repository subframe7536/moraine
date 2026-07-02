import type { VariantProps } from 'cls-variant'

import {
  CHECKABLE_BASE_SIZE_VARIANT,
  CHECKABLE_INDICATOR_VARIANT,
  CHECKABLE_WRAPPER_ALIGN_VARIANT,
  FLEX_ORIENTATION_VARIANT,
  TABLE_EDGE_ORIENTATION_VARIANT,
  TEXT_SIZE_VARIANT,
} from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const radioGroupRootVariants = cva('flex relative', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: FLEX_ORIENTATION_VARIANT,
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
      card: 'surface-border rounded-lg data-checked:border-primary',
      table: 'border border-muted relative data-checked:(border-primary/50 bg-primary/10 z-1)',
    },
    indicator: CHECKABLE_INDICATOR_VARIANT,
    tableOrientation: TABLE_EDGE_ORIENTATION_VARIANT,
  },
  compoundVariants: [
    {
      variant: 'card',
      size: 'xs',
      class: 'p-2.5',
    },
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
      variant: 'card',
      size: 'xl',
      class: 'p-4.5',
    },
    {
      variant: 'table',
      size: 'xs',
      class: 'p-2.5',
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
    {
      variant: 'table',
      size: 'xl',
      class: 'p-4.5',
    },
  ],
})

export const radioGroupBaseVariants = cva(
  'outline-none border border-input rounded-full bg-background inline-flex transition-shadow items-center justify-center overflow-hidden bg-clip-padding peer-focus-visible:effect-fv-border data-invalid:effect-invalid dark:bg-input/30',
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
