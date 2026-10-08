import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SwitchStyleSlot, SwitchStyleVariant } from './switch.style-types'

export const switchDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'invalid',
    'loading',
    'readonly',
    'required',
    'unchecked',
  ),
  track: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'invalid',
    'readonly',
    'unchecked',
  ),
  thumb: /* @__PURE__ */ createDataAttributes('checked', 'disabled', 'unchecked'),
  icon: /* @__PURE__ */ createDataAttributes('checked', 'loading', 'unchecked'),
  label: /* @__PURE__ */ createDataAttributes('required'),
} satisfies DataAttributeContract<keyof SwitchStyleSlot>

export const switchRecipe = /* @__PURE__ */ defineRecipe<SwitchStyleSlot, SwitchStyleVariant>(
  'switch',
  {
    base: {
      root: 'flex flex-row items-start',
      track: `${DATA_DISABLED_CLASS} p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-input transition-[color,background-color,box-shadow] items-center ${FOCUS_VISIBLE_CLASS}  ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS} data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80`,
      thumb:
        'rounded-full bg-background flex pointer-events-none shadow-input transition-transform items-center justify-center relative',
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
