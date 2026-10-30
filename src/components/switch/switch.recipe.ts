import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SwitchStyleSlot, SwitchStyleVariants } from './switch.style-types'

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

/**
 * Track edge drawn on an overlay instead of the track border. Browsers snap border widths
 * to whole device pixels (a 1px border is ~0.57px at 175% scaling); on the track itself that
 * resizes the content box and shifts the thumb off-center. The overlay border can snap
 * without affecting layout, so the 2px padding inset stays even at every scale.
 */
const SWITCH_TRACK_EDGE_CLASS =
  "relative focus-visible:(outline-none ring-3 ring-ring/50 after:border-ring) after:(border border-transparent rounded-full pointer-events-none content-[''] inset-0 absolute) data-invalid:(ring-3 ring-danger/20 after:border-danger) dark:data-invalid:(ring-danger/40 after:border-danger/50)"

export const switchRecipe = /* @__PURE__ */ defineRecipe<SwitchStyleSlot, SwitchStyleVariants>(
  'switch',
  {
    base: {
      root: 'flex flex-row items-start',
      track: `${DATA_DISABLED_CLASS} p-0.5 outline-none rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-input transition-[color,background-color,box-shadow] items-center ${SWITCH_TRACK_EDGE_CLASS} data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80`,
      thumb:
        'rounded-full bg-background flex pointer-events-none shadow-input transition-transform items-center justify-center relative',
      icon: 'text-primary transition-opacity absolute data-unchecked:(text-muted-foreground opacity-90) data-checked:opacity-100 data-loading:animate-spin',
      wrapper: 'flex flex-col gap-0.5',
      label:
        "text-foreground leading-tight font-medium block cursor-pointer select-none data-required:after:(text-danger-ink ms-0.5 content-['*'])",
      description: 'text-muted-foreground leading-normal',
    },
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: {
          track: 'h-4 w-7',
          thumb: 'text-[0.5rem] size-3 data-checked:translate-x-3',
          wrapper: 'text-xs ms-1.5',
          description: 'text-xs',
        },
        md: {
          track: 'h-4.5 w-8',
          thumb: 'text-[0.5625rem] size-3.5 data-checked:translate-x-3.5',
          wrapper: 'text-sm ms-2',
          description: 'text-sm',
        },
        lg: {
          track: 'h-5.5 w-10',
          thumb: 'text-xs size-4.5 data-checked:translate-x-4.5',
          wrapper: 'text-base ms-2.5',
          description: 'text-base',
        },
      },
    },
  },
)
