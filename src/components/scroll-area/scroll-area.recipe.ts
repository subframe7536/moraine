import type { JSX } from 'solid-js'

import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_RING_CLASS, SCROLLBAR_NONE_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariants } from './scroll-area.style-types'

/** Minimum thumb length in px, so very long content keeps a draggable thumb. */
export const SCROLL_AREA_THUMB_MIN_SIZE = 20

/**
 * Scrollbar geometry per axis and `scrollbarWidth`. Each scrollbar has a fixed axis, so the
 * classes are picked per element instead of through `data-orientation` selectors. The transparent
 * borders leave the thumb a 1px inset, with a wider inset on the content side.
 */
export const SCROLL_AREA_SCROLLBAR_CLASS = {
  y: {
    normal: 'border-y border-e border-s-2 w-2.5 end-0 bottom-0 top-0 data-corner:bottom-2.5',
    thin: 'border-y border-e border-s-2 w-2 end-0 bottom-0 top-0 data-corner:bottom-2',
  },
  x: {
    normal:
      'border-x border-b border-t-2 flex-col h-2.5 end-0 start-0 bottom-0 data-corner:end-2.5',
    thin: 'border-x border-b border-t-2 flex-col h-2 end-0 start-0 bottom-0 data-corner:end-2',
  },
} as const

/** Viewport mask for the `shadow` variant; the mask layers are recipe variables on the root. */
export const SCROLL_AREA_SHADOW_STYLE: JSX.CSSProperties = {
  'mask-composite': 'intersect',
  'mask-image': 'var(--scroll-area-shadow-y), var(--scroll-area-shadow-x)',
}

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
  scrollbar: /* @__PURE__ */ createDataAttributes('orientation', 'visible', 'corner'),
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
      'border-transparent opacity-0 flex pointer-events-none select-none transition-opacity absolute touch-none data-visible:(opacity-100 pointer-events-auto)',
    thumb:
      'rounded-full bg-border flex-1 transition-colors relative active:bg-muted-foreground/50 hover:bg-muted-foreground/30',
    corner: 'size-2.5 hidden end-0 bottom-0 absolute data-visible:block',
    '--scroll-area-shadow-size': '40px',
    '--scroll-area-shadow-y':
      'linear-gradient(to bottom, transparent, #000 min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-y-start)), #000 calc(100% - min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-y-end))), transparent)',
    '--scroll-area-shadow-x':
      'linear-gradient(var(--scroll-area-shadow-x-direction), transparent, #000 min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-x-start)), #000 calc(100% - min(var(--scroll-area-shadow-size), var(--scroll-area-overflow-x-end))), transparent)',
  },
  defaultVariants: {
    orientation: 'vertical',
    scrollbarVariant: 'hover',
    scrollbarWidth: 'normal',
    shadow: false,
  },
  variants: {
    orientation: {
      vertical: { viewport: 'overflow-x-hidden overflow-y-auto' },
      horizontal: { viewport: 'overflow-x-auto overflow-y-hidden', content: 'min-w-full w-max' },
      both: { viewport: 'overflow-auto', content: 'min-w-full w-max' },
    },
    scrollbarVariant: {
      always: { viewport: SCROLLBAR_NONE_CLASS },
      hover: { viewport: SCROLLBAR_NONE_CLASS },
      scroll: { viewport: SCROLLBAR_NONE_CLASS },
      hidden: { viewport: SCROLLBAR_NONE_CLASS },
    },
  },
  compoundVariants: [
    {
      variants: { scrollbarVariant: 'native', scrollbarWidth: 'thin' },
      viewport: '[scrollbar-width:thin]',
    },
  ],
})
