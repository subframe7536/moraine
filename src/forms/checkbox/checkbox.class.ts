import type { VariantProps } from 'cls-variant'

import {
  CHECKABLE_BASE_SIZE_VARIANT,
  CHECKABLE_INDICATOR_VARIANT,
  CHECKABLE_WRAPPER_ALIGN_VARIANT,
  REQUIRED_MARK_VARIANT,
  TEXT_SIZE_VARIANT,
} from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const checkboxRootVariants = cva('flex items-start relative', {
  defaultVariants: {
    indicator: 'start',
  },
  variants: {
    variant: {
      card: 'surface-border rounded-md',
      list: '',
    },
    indicator: CHECKABLE_INDICATOR_VARIANT,
  },
})

export const checkboxCardPaddingVariants = cva('p-3', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'p-2.5',
      sm: 'p-3',
      md: 'p-3',
      lg: 'p-4',
      xl: 'p-4.5',
    },
  },
})

export const checkboxBaseVariants = cva(
  'outline-none border border-input rounded-xs bg-background inline-flex shrink-0 cursor-pointer shadow-xs transition-shadow items-center justify-center overflow-hidden bg-clip-padding focus-visible:effect-fv-border data-checked:(border-primary bg-primary) data-invalid:effect-invalid dark:bg-input/30',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: CHECKABLE_BASE_SIZE_VARIANT,
    },
  },
)

export const checkboxIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-2.5',
      sm: 'size-3',
      md: 'size-3.5',
      lg: 'size-4',
      xl: 'size-4.5',
    },
  },
})

export const checkboxWrapperVariants = cva('w-full', {
  defaultVariants: {
    indicator: 'start',
    size: 'md',
  },
  variants: {
    indicator: CHECKABLE_WRAPPER_ALIGN_VARIANT,
    size: TEXT_SIZE_VARIANT,
  },
})

export const checkboxLabelVariants = cva('text-foreground font-medium block select-none', {
  variants: {
    required: REQUIRED_MARK_VARIANT,
  },
})

type CheckboxRootVariantProps = Omit<
  VariantProps<typeof checkboxRootVariants>,
  'variant' | 'indicator'
>

export type CheckboxVariantProps = CheckboxRootVariantProps &
  VariantProps<typeof checkboxBaseVariants> & {
    variant?: 'list' | 'card'
    indicator?: 'start' | 'end' | 'hidden'
  }
