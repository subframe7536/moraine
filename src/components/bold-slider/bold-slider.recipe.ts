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
const ROW_CLASS = 'px-(--bs-pad) flex gap-2 items-center justify-between'

/** Clip box that matches the filled range, so the copy inside it uses the fill colors. */
export const BOLD_SLIDER_FILL_CLASS =
  'rounded-[inherit] flex pointer-events-none start-0 inset-y-0 justify-start absolute overflow-hidden peer-data-[inverted]:end-0 peer-data-[inverted]:start-auto peer-data-[inverted]:justify-end'

/** Track-wide row inside the clip box (width set inline), aligned to the same edge as the fill. */
export const BOLD_SLIDER_FILL_ROW_CLASS = `shrink-0 h-full ${ROW_CLASS}`

export const boldSliderDataAttributes = {
  label: /* @__PURE__ */ createDataAttributes('fill'),
  value: /* @__PURE__ */ createDataAttributes('fill'),
} satisfies DataAttributeContract<keyof BoldSliderStyleSlot>

export const boldSliderRecipe = /* @__PURE__ */ defineRecipe<
  BoldSliderStyleSlot,
  BoldSliderStyleVariants
>('boldSlider', {
  base: {
    root: '',
    track: 'peer rounded-[inherit] bg-muted cursor-pointer',
    range: 'rounded-[inherit]',
    marker: 'rounded-full bg-muted-foreground/40 h-2 data-active:opacity-0',
    thumb: 'peer opacity-0 size-px pointer-events-none',
    content: `rounded-[inherit] pointer-events-none transition-shadow inset-0 absolute overflow-hidden ${ROW_CLASS} peer-focus-visible:(ring-3 ring-ring/50)`,
    label:
      'text-muted-foreground font-medium min-w-0 truncate data-fill:text-primary-foreground/80',
    value:
      'text-foreground font-medium ms-auto shrink-0 tabular-nums data-fill:text-primary-foreground',
    indicator:
      "text-primary-foreground px-(--bs-indicator-gap) rounded-[inherit] opacity-40 flex pointer-events-none scale-y-75 transition-[opacity,transform] duration-150 ease-out items-center start-0 inset-y-0 justify-end absolute overflow-hidden before:(rounded-full bg-current shrink-0 w-1.25 content-['']) peer-data-[dragging]:opacity-90 peer-focus-visible:opacity-90 peer-hover:opacity-90 peer-data-[dragging]:scale-y-100 peer-focus-visible:scale-y-100 peer-hover:scale-y-100 peer-data-[inverted]:(end-0 start-auto justify-start)",
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
  },
  variants: {
    size: {
      sm: {
        '--bs-pad': '13px',
        '--bs-indicator-gap': '5px',
        root: 'text-xs rounded-md',
        track: 'h-8',
        indicator: 'before:h-4.5',
      },
      md: {
        '--bs-pad': '15px',
        '--bs-indicator-gap': '6px',
        root: 'text-sm rounded-md',
        track: 'h-9',
        indicator: 'before:h-5',
      },
      lg: {
        '--bs-pad': '17px',
        '--bs-indicator-gap': '7px',
        root: 'text-sm rounded-lg',
        track: 'h-10',
        indicator: 'before:h-5.5',
      },
    },
    variant: {
      solid: {},
      subtle: {
        range: 'bg-muted-active',
        label: 'data-fill:text-muted-foreground',
        value: 'data-fill:text-foreground',
        indicator: 'text-foreground',
      },
    },
  },
})
