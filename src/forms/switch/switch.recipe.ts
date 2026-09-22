import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { SwitchStyleSlot, SwitchStyleVariant } from './switch.style-types'

export const switchDataAttributes = {
  root: (state: StyleContractState) =>
    createDataAttributes({
      'data-checked': state.checked,
      'data-disabled': state.disabled,
      'data-invalid': state.invalid,
      'data-loading': state.loading,
      'data-readonly': state.readonly,
      'data-required': state.required,
      'data-unchecked': state.unchecked,
    }),
  track: (state: StyleContractState) =>
    createDataAttributes({
      'data-checked': state.checked,
      'data-disabled': state.disabled,
      'data-invalid': state.invalid,
      'data-readonly': state.readonly,
      'data-unchecked': state.unchecked,
    }),
  thumb: (state: StyleContractState) =>
    createDataAttributes({
      'data-checked': state.checked,
      'data-disabled': state.disabled,
      'data-unchecked': state.unchecked,
    }),
  icon: (state: StyleContractState) =>
    createDataAttributes({
      'data-checked': state.checked,
      'data-loading': state.loading,
      'data-unchecked': state.unchecked,
    }),
  label: (state: StyleContractState) => createDataAttributes({ 'data-required': state.required }),
}

export const switchRecipe = /* @__PURE__ */ defineRecipe<SwitchStyleSlot, SwitchStyleVariant>(
  'switch',
  {
    base: {
      root: 'flex flex-row items-start',
      track:
        'data-disabled:(opacity-64 pointer-events-none) p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-xs transition-[color,background-color,box-shadow] items-center focus-visible:(outline-none border-ring ring-3 ring-ring/50) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:data-invalid:(border-destructive/50 ring-destructive/40) data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80',
      thumb:
        'rounded-full bg-background flex pointer-events-none shadow-sm transition-transform items-center justify-center relative',
      icon: 'text-primary size-4/5 transition-opacity absolute data-unchecked:(text-muted-foreground opacity-90) data-checked:opacity-100 data-loading:animate-spin',
      wrapper: 'flex flex-col gap-0.5',
      label:
        "text-foreground leading-tight font-medium block cursor-pointer select-none data-required:after:(text-destructive ms-0.5 content-['*'])",
      description: 'text-muted-foreground leading-normal',
    },
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: {
          track: 'h-4 w-7',
          thumb: 'size-3 data-checked:translate-x-3',
          wrapper: 'text-xs ms-1.5',
          description: 'text-xs',
        },
        md: {
          track: 'h-4.5 w-8',
          thumb: 'size-3.5 data-checked:translate-x-3.5',
          wrapper: 'text-sm ms-2',
          description: 'text-sm',
        },
        lg: {
          track: 'h-5.5 w-10',
          thumb: 'size-4.5 data-checked:translate-x-4.5',
          wrapper: 'text-base ms-2.5',
          description: 'text-base',
        },
      },
    },
  },
)
