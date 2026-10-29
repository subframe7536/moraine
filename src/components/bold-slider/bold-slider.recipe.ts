import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { BoldSliderStyleSlot, BoldSliderStyleVariants } from './bold-slider.style-types'

/** Row that places the label at the range origin and the value at the far end. */
export const BOLD_SLIDER_LAYER_CLASS =
  'px-(--bs-pad) flex gap-2 items-center inset-0 justify-between absolute group-data-[inverted]:flex-row-reverse'

/** Clip box that matches the filled range, so the copy inside it uses the fill colors. */
export const BOLD_SLIDER_FILL_CLASS =
  'transition-[width] duration-150 ease-out start-0 inset-y-0 absolute overflow-hidden group-data-[dragging]:transition-none group-data-[inverted]:(end-0 start-auto)'

/** Full-width copy inside the clip box, anchored to the same edge as the fill. */
export const BOLD_SLIDER_FILL_LAYER_CLASS =
  'w-[100cqw] start-0 inset-y-0 absolute group-data-[inverted]:(end-0 start-auto)'

export const boldSliderDataAttributes = {
  label: /* @__PURE__ */ createDataAttributes('fill'),
  value: /* @__PURE__ */ createDataAttributes('fill'),
  indicator: /* @__PURE__ */ createDataAttributes('fill'),
} satisfies DataAttributeContract<keyof BoldSliderStyleSlot>

export const boldSliderRecipe = /* @__PURE__ */ defineRecipe<
  BoldSliderStyleSlot,
  BoldSliderStyleVariants
>('boldSlider', {
  base: {
    '--bs-indicator-width': '5px',
    '--bs-indicator-gap': '4px',
    root: '',
    track:
      'bg-muted cursor-pointer transition-shadow group-has-[:focus-visible]:(ring-3 ring-ring/50)',
    range:
      'rounded-[inherit] transition-[left,right] duration-150 ease-out group-data-[dragging]:transition-none',
    marker: 'rounded-full bg-muted-foreground/40 h-2',
    thumb: 'opacity-0 size-px pointer-events-none',
    content: '@container pointer-events-none inset-0 absolute overflow-hidden',
    label:
      'text-muted-foreground font-medium min-w-0 truncate data-fill:text-primary-foreground/80',
    value:
      'text-foreground font-medium ms-auto shrink-0 tabular-nums data-fill:text-primary-foreground group-data-[inverted]:(me-auto ms-0)',
    indicator:
      'rounded-full bg-primary opacity-40 h-3/5 w-(--bs-indicator-width) scale-75 duration-150 ease-out [transition-property:opacity,scale,inset-inline-start,inset-inline-end] top-1/2 absolute data-fill:bg-primary-foreground group-data-[dragging]:(opacity-90 scale-100 [transition-property:opacity,scale]) group-has-[:focus-visible]:(opacity-90 scale-100) group-hover:(opacity-90 scale-100) -translate-y-1/2',
  },
  defaultVariants: {
    size: 'md',
    subtle: false,
  },
  variants: {
    size: {
      sm: { '--bs-pad': '10px', track: 'rounded-md h-8', content: 'text-xs rounded-md' },
      md: { '--bs-pad': '12px', track: 'rounded-md h-9', content: 'text-sm rounded-md' },
      lg: { '--bs-pad': '14px', track: 'rounded-lg h-10', content: 'text-sm rounded-lg' },
    },
    subtle: {
      true: {
        range: 'bg-foreground/10',
        label: 'data-fill:text-muted-foreground',
        value: 'data-fill:text-foreground',
        indicator: 'bg-foreground data-fill:bg-foreground',
      },
    },
  },
})
