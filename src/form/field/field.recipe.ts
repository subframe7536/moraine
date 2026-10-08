import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { FieldRecipeVariant, FieldStyleSlot } from './field.style-types'

export const fieldDataAttributes = {
  label: /* @__PURE__ */ createDataAttributes('required'),
  container: /* @__PURE__ */ createDataAttributes('has-text'),
} satisfies DataAttributeContract<keyof FieldStyleSlot>

export const fieldRecipe = /* @__PURE__ */ defineRecipe<FieldStyleSlot, FieldRecipeVariant>(
  'field',
  {
    base: {
      root: '',
      wrapper: 'flex flex-col gap-1',
      labelWrapper: 'flex gap-1.5 items-center',
      label:
        "text-foreground font-medium block data-required:after:(text-destructive ms-0.5 content-['*'])",
      container: 'flex flex-col gap-1.5 relative',
      description: 'text-muted-foreground leading-normal',
      error: 'text-destructive leading-normal font-medium',
      hint: 'text-muted-foreground',
      help: 'text-muted-foreground leading-normal',
    },
    defaultVariants: {
      size: 'md',
      orientation: 'vertical',
      labelHidden: false,
      hasLabelText: false,
      hasText: false,
    },
    variants: {
      labelHidden: {
        true: {
          label: 'sr-only',
        },
      },
      size: {
        sm: {
          root: 'text-xs',
        },
        md: {
          root: 'text-sm',
        },
        lg: {
          root: 'text-base',
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
    },
    compoundVariants: [
      {
        variants: { labelHidden: true, hasText: false },
        wrapper: 'contents',
      },
      {
        variants: { labelHidden: true, hasLabelText: false },
        labelWrapper: 'contents',
      },
      {
        variants: { orientation: 'horizontal', labelHidden: true, hasText: false },
        container: 'col-span-4',
      },
      {
        variants: { orientation: 'horizontal' },
        label:
          "data-required:before:(text-destructive me-0.5 content-['*']) data-required:after:content-none",
      },
      {
        variants: { orientation: 'vertical', size: 'sm', hasText: true },
        container: 'mt-1.5',
      },
      {
        variants: { orientation: 'vertical', size: 'md', hasText: true },
        container: 'mt-2',
      },
      {
        variants: { orientation: 'vertical', size: 'lg', hasText: true },
        container: 'mt-2.5',
      },
    ],
  },
)
