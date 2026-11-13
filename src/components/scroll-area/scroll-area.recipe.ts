import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariants } from './scroll-area.style-types'

/** Minimum thumb length in px, so very long content keeps a draggable thumb. */
export const SCROLL_AREA_THUMB_MIN_SIZE = 20

const HIDE_NATIVE_SCROLLBAR_CLASS = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export const scrollAreaDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'orientation',
    'overflow-x',
    'overflow-y',
    'overflow-x-start',
    'overflow-x-end',
    'overflow-y-start',
    'overflow-y-end',
    'scrolling',
    'hovering',
  ),
  scrollbar: /* @__PURE__ */ createDataAttributes('orientation', 'visible', 'dragging', 'corner'),
  corner: /* @__PURE__ */ createDataAttributes('visible'),
} satisfies DataAttributeContract<keyof ScrollAreaStyleSlot>

export const scrollAreaRecipe = /* @__PURE__ */ defineRecipe<
  ScrollAreaStyleSlot,
  ScrollAreaStyleVariants
>('scrollArea', {
  base: {
    root: 'flex flex-col min-h-0 min-w-0 relative',
    viewport: `rounded-[inherit] flex-auto min-h-0 min-w-0 ${FOCUS_VISIBLE_RING_CLASS}`,
    content: '',
    scrollbar:
      'border-2 border-transparent opacity-0 flex pointer-events-none select-none transition-opacity duration-150 absolute touch-none data-visible:(opacity-100 pointer-events-auto) data-[orientation=horizontal]:(h-2.5 end-0 start-0 bottom-0 data-corner:end-2.5) data-[orientation=vertical]:(w-2.5 end-0 bottom-0 top-0 data-corner:bottom-2.5)',
    thumb:
      'rounded-full bg-border transition-colors absolute [[data-dragging]>&]:bg-muted-foreground/40 hover:bg-muted-foreground/40',
    corner: 'size-2.5 hidden end-0 bottom-0 absolute data-visible:block',
    '--scroll-area-shadow-size': '40px',
    '--scroll-area-shadow-y':
      'linear-gradient(to bottom, transparent, #000 min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-y-start)), #000 calc(100% - min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-y-end))), transparent)',
    '--scroll-area-shadow-x':
      'linear-gradient(var(--scroll-area-shadow-x-direction), transparent, #000 min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-x-start)), #000 calc(100% - min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-x-end))), transparent)',
  },
  defaultVariants: {
    orientation: 'vertical',
    scrollbar: 'auto',
    shadow: false,
  },
  variants: {
    orientation: {
      vertical: { viewport: 'overflow-x-hidden overflow-y-auto' },
      horizontal: { viewport: 'overflow-x-auto overflow-y-hidden', content: 'min-w-full w-max' },
      both: { viewport: 'overflow-auto', content: 'min-w-full w-max' },
    },
    scrollbar: {
      auto: { viewport: HIDE_NATIVE_SCROLLBAR_CLASS },
      always: { viewport: HIDE_NATIVE_SCROLLBAR_CLASS },
      hover: { viewport: HIDE_NATIVE_SCROLLBAR_CLASS },
      scroll: { viewport: HIDE_NATIVE_SCROLLBAR_CLASS },
      native: {},
      hidden: { viewport: HIDE_NATIVE_SCROLLBAR_CLASS },
    },
    shadow: {
      true: {
        viewport:
          '[mask-composite:intersect] [mask-image:var(--scroll-area-shadow-y),var(--scroll-area-shadow-x)]',
      },
    },
  },
})
