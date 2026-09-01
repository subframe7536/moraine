import type { VariantProps } from 'cls-variant'

import { TEXT_SIZE_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const formFieldSizeVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const FORM_FIELD_LABEL_CLASS = 'text-foreground font-medium block'
export const FORM_FIELD_CONTAINER_CLASS = 'flex flex-col gap-1.5 relative'
export const FORM_FIELD_WRAPPER_CLASS = 'flex flex-col gap-1'
export const FORM_FIELD_LABEL_WRAPPER_CLASS = 'flex gap-1.5 items-center'
export const FORM_FIELD_HINT_CLASS = 'text-muted-foreground'
export const FORM_FIELD_DESCRIPTION_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_HELP_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_ERROR_CLASS = 'text-destructive font-medium leading-normal'
export const FORM_FIELD_HORIZONTAL_WRAPPER_CLASS = 'text-end col-span-1 items-end'
export const FORM_FIELD_LABEL_RIGHT_ALIGN_CLASS = 'justify-end'
export const FORM_FIELD_LABEL_BETWEEN_ALIGN_CLASS = 'justify-between'
export const FORM_FIELD_HORIZONTAL_CONTAINER_CLASS = 'col-span-3 min-w-0'
export const FORM_FIELD_VERTICAL_SPACING_CLASS = 'mt-1.5'
export const FORM_FIELD_HORIZONTAL_REQUIRED_MARK_CLASS =
  "before:(text-destructive me-0.5 content-['*']) after:content-none"

export type FormFieldVariantProps = VariantProps<typeof formFieldSizeVariants> & {
  orientation?: 'vertical' | 'horizontal'
}
