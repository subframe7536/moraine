import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS, FOCUS_VISIBLE_CLASS } from '../../theme/recipe-common.recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { SliderStyleSlot, SliderStyleVariants } from './slider.style-types'

export const sliderDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'disabled',
    'dragging',
    'invalid',
    'inverted',
    'multiple',
    'readonly',
    'required',
  ),
  range: /* @__PURE__ */ createDataAttributes('inverted', 'multiple'),
  thumb: /* @__PURE__ */ createDataAttributes(
    'disabled',
    'dragging',
    'invalid',
    'inverted',
    'readonly',
    'required',
  ),
} satisfies DataAttributeContract<keyof SliderStyleSlot>

export const sliderRecipe = /* @__PURE__ */ defineRecipe<SliderStyleSlot, SliderStyleVariants>(
  'slider',
  {
    base: {
      root: `group flex select-none items-center relative touch-none ${DATA_DISABLED_CLASS}`,
      track: 'rounded-full bg-input select-none translate-z-0 relative overflow-hidden',
      range: 'rounded-full bg-primary select-none absolute z-raised',
      marker: 'bg-background pointer-events-none absolute',
      thumb: `outline-none border border-border rounded-full bg-background shrink-0 size-(--s-thumb-size) block cursor-pointer select-none transition-[box-shadow,transform] absolute z-control bg-clip-padding touch-none ${FOCUS_VISIBLE_CLASS} hover:(border-ring ring-3 ring-ring/50) dark:bg-foreground data-dragging:scale-120`,
    },
    defaultVariants: {
      orientation: 'horizontal',
      size: 'md',
    },
    variants: {
      size: {
        sm: { '--s-size': '4px', '--s-thumb-size': '12px' },
        md: { '--s-size': '5px', '--s-thumb-size': '15px' },
        lg: { '--s-size': '6px', '--s-thumb-size': '18px' },
      },
      orientation: {
        horizontal: {
          root: 'w-full',
          track: 'h-(--s-size) w-full',
          range: 'h-full',
          marker: 'h-full w-px top-1/2 -translate-x-1/2 -translate-y-1/2',
          thumb: '-translate-x-1/2 data-inverted:translate-x-1/2',
        },
        vertical: {
          root: 'flex-col h-full',
          track: 'h-full w-(--s-size)',
          range: 'w-full',
          marker: 'h-px w-full left-1/2 -translate-x-1/2 -translate-y-1/2',
          thumb: 'translate-y-1/2 data-inverted:-translate-y-1/2',
        },
      },
    },
  },
)
