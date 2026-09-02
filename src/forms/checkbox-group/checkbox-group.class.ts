import type { VariantProps } from 'cls-variant'

import {
  CARD_PADDING_SIZE_VARIANT,
  FLEX_ORIENTATION_VARIANT,
  REQUIRED_MARK_VARIANT,
  TABLE_EDGE_ORIENTATION_VARIANT,
  TEXT_SIZE_VARIANT,
} from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const checkboxGroupFieldsetVariants = cva('flex', {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: FLEX_ORIENTATION_VARIANT,
  },
})

export const checkboxGroupLegendVariants = cva('text-foreground font-medium mb-1.5 block', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
    required: REQUIRED_MARK_VARIANT,
  },
})

export const checkboxGroupItemVariants = cva('', {
  variants: {
    tableSize: CARD_PADDING_SIZE_VARIANT,
    tableOrientation: TABLE_EDGE_ORIENTATION_VARIANT,
  },
})
export type CheckboxGroupVariantProps = VariantProps<typeof checkboxGroupFieldsetVariants> &
  VariantProps<typeof checkboxGroupLegendVariants> & {
    variant?: 'list' | 'card' | 'table'
  }
