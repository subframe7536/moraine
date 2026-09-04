import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const FORM_FIELD_WRAPPER_CLASS = 'flex flex-col gap-1'
export const FORM_FIELD_LABEL_WRAPPER_CLASS = 'flex gap-1.5 items-center'
export const FORM_FIELD_HINT_CLASS = 'text-muted-foreground'
export const FORM_FIELD_DESCRIPTION_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_HELP_CLASS = 'text-muted-foreground leading-normal'
export const FORM_FIELD_ERROR_CLASS = 'text-destructive font-medium leading-normal'

export const formFieldRecipe = recipe({
  slots: [
    'root',
    'wrapper',
    'labelWrapper',
    'label',
    'container',
    'description',
    'error',
    'hint',
    'help',
  ],
  base: {
    root: '',
    wrapper: FORM_FIELD_WRAPPER_CLASS,
    labelWrapper: FORM_FIELD_LABEL_WRAPPER_CLASS,
    label: 'text-foreground font-medium block',
    container: 'flex flex-col gap-1.5 relative',
    description: FORM_FIELD_DESCRIPTION_CLASS,
    error: FORM_FIELD_ERROR_CLASS,
    hint: FORM_FIELD_HINT_CLASS,
    help: FORM_FIELD_HELP_CLASS,
  },
  defaultVariants: {
    size: 'md',
    orientation: 'vertical',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs',
        description: 'text-xs leading-normal',
        error: 'text-xs leading-normal',
        hint: 'text-xs',
        help: 'text-xs leading-normal',
      },
      md: {
        root: 'text-sm',
        description: 'text-sm leading-normal',
        error: 'text-sm leading-normal',
        hint: 'text-sm',
        help: 'text-sm leading-normal',
      },
      lg: {
        root: 'text-base',
        description: 'text-base leading-normal',
        error: 'text-base leading-normal',
        hint: 'text-base',
        help: 'text-base leading-normal',
      },
    },
    orientation: {
      vertical: {
        labelWrapper: 'justify-between',
      },
      horizontal: {
        root: 'gap-x-2 grid grid-cols-4 items-baseline',
        wrapper: 'text-end col-span-1 items-end',
        labelWrapper: 'justify-end',
        container: 'col-span-3 min-w-0',
      },
    },
    required: {
      true: {
        label: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
      false: {},
    },
    hasText: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        orientation: 'horizontal',
        required: true,
      },
      class: {
        label: "before:text-destructive before:me-0.5 before:content-['*'] after:content-none",
      },
    },
    {
      variants: {
        orientation: 'vertical',
        hasText: true,
      },
      class: {
        container: 'mt-1.5',
      },
    },
  ],
})

export type FormFieldVariantProps = VariantProps<typeof formFieldRecipe>
