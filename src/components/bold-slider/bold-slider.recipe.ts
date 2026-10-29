import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { BoldSliderStyleSlot, BoldSliderStyleVariants } from './bold-slider.style-types'

/*
 * State selectors use `peer-*` only. Slider renders the track, then the thumb, then BoldSlider's
 * overlay parts as root children, so every part that reacts to hover (track), keyboard focus,
 * dragging, or inversion (thumb) is a later sibling of its peer and never sees another slider.
 */

/** Row that places the label at the start of the track and the value at the end. */
export const BOLD_SLIDER_LAYER_CLASS =
  'px-(--bs-pad) flex gap-2 items-center inset-0 justify-between absolute'

/** Clip box that matches the filled range, so the copy inside it uses the fill colors. */
export const BOLD_SLIDER_FILL_CLASS =
  'rounded-[inherit] flex pointer-events-none start-0 inset-y-0 justify-start absolute overflow-hidden peer-data-[inverted]:end-0 peer-data-[inverted]:start-auto peer-data-[inverted]:justify-end'

/** Track-wide copy inside the clip box (width set inline), aligned to the same edge as the fill. */
export const BOLD_SLIDER_FILL_LAYER_CLASS = 'shrink-0 h-full relative'

/** Capsule drawn in the indicator box; its color comes from the indicator text color. */
export const BOLD_SLIDER_INDICATOR_CAPSULE_CLASS =
  'rounded-full bg-current shrink-0 h-(--bs-indicator-height) w-(--bs-indicator-width)'

export const boldSliderDataAttributes = {
  label: /* @__PURE__ */ createDataAttributes('fill'),
  value: /* @__PURE__ */ createDataAttributes('fill'),
} satisfies DataAttributeContract<keyof BoldSliderStyleSlot>

export const boldSliderRecipe = /* @__PURE__ */ defineRecipe<
  BoldSliderStyleSlot,
  BoldSliderStyleVariants
>('boldSlider', {
  base: {
    '--bs-indicator-width': '5px',
    root: '',
    track: 'peer rounded-[inherit] bg-muted cursor-pointer',
    range: 'rounded-[inherit]',
    marker: 'rounded-full bg-muted-foreground/40 h-2 data-active:opacity-0',
    thumb: 'peer opacity-0 size-px pointer-events-none',
    content:
      'rounded-[inherit] pointer-events-none transition-shadow inset-0 absolute overflow-hidden peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
    label:
      'text-muted-foreground font-medium min-w-0 truncate data-fill:text-primary-foreground/80',
    value:
      'text-foreground font-medium ms-auto shrink-0 tabular-nums data-fill:text-primary-foreground',
    indicator:
      'text-primary-foreground px-(--bs-indicator-gap) rounded-[inherit] opacity-40 flex pointer-events-none scale-y-75 transition-[opacity,transform] duration-150 ease-out items-center start-0 inset-y-0 justify-end absolute overflow-hidden peer-data-[dragging]:opacity-90 peer-focus-visible:opacity-90 peer-hover:opacity-90 peer-data-[dragging]:scale-y-100 peer-focus-visible:scale-y-100 peer-hover:scale-y-100 peer-data-[inverted]:(end-0 start-auto justify-start)',
  },
  defaultVariants: {
    size: 'md',
    subtle: false,
  },
  variants: {
    size: {
      sm: {
        '--bs-pad': '13px',
        '--bs-indicator-gap': '5px',
        '--bs-indicator-height': '18px',
        root: 'text-xs rounded-md',
        track: 'h-8',
      },
      md: {
        '--bs-pad': '15px',
        '--bs-indicator-gap': '6px',
        '--bs-indicator-height': '20px',
        root: 'text-sm rounded-md',
        track: 'h-9',
      },
      lg: {
        '--bs-pad': '17px',
        '--bs-indicator-gap': '7px',
        '--bs-indicator-height': '22px',
        root: 'text-sm rounded-lg',
        track: 'h-10',
      },
    },
    subtle: {
      true: {
        range: 'bg-muted-active',
        label: 'data-fill:text-muted-foreground',
        value: 'data-fill:text-foreground',
        indicator: 'text-foreground',
      },
    },
  },
})
