import type { VariantProps } from 'cls-variant'

import { REQUIRED_MARK_VARIANT, TEXT_SIZE_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const formFieldSizeVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const formFieldLabelVariants = cva('text-foreground font-medium block', {
  variants: {
    required: REQUIRED_MARK_VARIANT,
    orientation: {
      vertical: '',
      horizontal: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      required: true,
      class: "before:(text-destructive me-0.5 content-['*']) after:content-none",
    },
  ],
})

export const FORM_FIELD_WRAPPER_CLASS = 'flex flex-col gap-1'
export const FORM_FIELD_LABEL_WRAPPER_CLASS = 'flex gap-1.5 items-center'
export const FORM_FIELD_HINT_CLASS = 'text-muted-foreground'
export const FORM_FIELD_DESCRIPTION_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_HELP_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_ERROR_CLASS = 'text-destructive font-medium leading-normal'

export const formFieldContainerVariants = cva('flex flex-col gap-1.5 relative', {
  variants: {
    orientation: {
      vertical: '',
      horizontal: 'col-span-3 min-w-0',
    },
    hasText: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      hasText: true,
      class: 'mt-1.5',
    },
  ],
})

export type FormFieldVariantProps = VariantProps<typeof formFieldSizeVariants> & {
  orientation?: 'vertical' | 'horizontal'
}
