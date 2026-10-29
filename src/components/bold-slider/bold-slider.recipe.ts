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

/** Track-wide copy of the row, clipped inline to the filled range so it uses the fill colors. */
export const BOLD_SLIDER_FILL_ROW_CLASS = `pointer-events-none inset-0 absolute ${ROW_CLASS}`

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
    // Minimum fill: room for the indicator and its gap on both sides.
    '--bs-inset': 'calc(var(--bs-indicator-gap) * 2 + var(--bs-indicator-width))',
    root: '',
    track: 'peer rounded-[inherit] bg-muted cursor-pointer overflow-visible',
    range: 'rounded-[inherit]',
    marker: 'rounded-full bg-muted-foreground/40 h-2 data-active:opacity-0',
    thumb: 'peer opacity-0 size-px pointer-events-none',
    content: `rounded-[inherit] pointer-events-none transition-shadow inset-0 absolute overflow-hidden ${ROW_CLASS} peer-data-[focus-visible]:(ring-3 ring-ring/50)`,
    label:
      'text-muted-foreground font-medium min-w-0 truncate data-fill:text-primary-foreground/80',
    value:
      'text-foreground font-medium ms-auto shrink-0 tabular-nums data-fill:text-primary-foreground',
    indicator:
      'opacity-40 pointer-events-none scale-y-75 transition-[opacity,transform] duration-150 ease-out inset-0 absolute peer-data-[dragging]:(opacity-90 scale-y-100) peer-data-[focus-visible]:(opacity-90 scale-y-100) peer-hover:(opacity-90 scale-y-100)',
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
    variant: {
      solid: {
        '--bs-indicator-fill': 'var(--primary-foreground)',
        '--bs-indicator-track': 'var(--primary)',
      },
      subtle: {
        '--bs-indicator-fill': 'var(--foreground)',
        '--bs-indicator-track': 'var(--foreground)',
        range: 'bg-muted-active',
        label: 'data-fill:text-muted-foreground',
        value: 'data-fill:text-foreground',
      },
    },
  },
})
