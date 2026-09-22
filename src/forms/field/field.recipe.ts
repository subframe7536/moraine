import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { FieldStyleSlot, FieldStyleVariant } from './field.style-types'

export const fieldDataAttributes = {
  label: (state: StyleContractState) => createDataAttributes({ 'data-required': state.required }),
  container: (state: StyleContractState) =>
    createDataAttributes({ 'data-has-text': state['has-text'] }),
}

export const fieldRecipe = /* @__PURE__ */ defineRecipe<FieldStyleSlot, FieldStyleVariant>(
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
      error: 'text-destructive font-medium leading-normal',
      hint: 'text-muted-foreground',
      help: 'text-muted-foreground leading-normal',
    },
    defaultVariants: {
      size: 'md',
      orientation: 'vertical',
    },
    variants: {
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
        variants: { orientation: 'horizontal' },
        label:
          "data-required:before:(text-destructive me-0.5 content-['*']) data-required:after:content-none",
      },
      {
        variants: { orientation: 'vertical', size: 'sm' },
        container: 'data-has-text:mt-1.5',
      },
      {
        variants: { orientation: 'vertical', size: 'md' },
        container: 'data-has-text:mt-2',
      },
      {
        variants: { orientation: 'vertical', size: 'lg' },
        container: 'data-has-text:mt-2.5',
      },
    ],
  },
)
