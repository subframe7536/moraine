import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariant } from './scroll-area.style-types'

export const scrollAreaDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('orientation', 'shadow-start', 'shadow-end'),
} satisfies DataAttributeContract<keyof ScrollAreaStyleSlot>

export const scrollAreaRecipe = /* @__PURE__ */ defineRecipe<
  ScrollAreaStyleSlot,
  ScrollAreaStyleVariant
>('scrollArea', {
  base: {
    root: 'min-h-0 min-w-0',
    '--scroll-area-shadow-size': '40px',
    '--scroll-area-shadow-start': 'transparent, black var(--scroll-area-shadow-size)',
    '--scroll-area-shadow-end': 'black calc(100% - var(--scroll-area-shadow-size)), transparent',
  },
  defaultVariants: {
    orientation: 'vertical',
    shadow: false,
    hideScrollbar: false,
  },
  variants: {
    orientation: {
      vertical: {
        root: 'overflow-x-hidden overflow-y-auto',
        '--scroll-area-direction': 'to bottom',
      },
      horizontal: {
        root: 'overflow-x-auto overflow-y-hidden',
        '--scroll-area-direction': 'to right',
      },
    },
    shadow: {
      true: {
        root: 'data-shadow-end:[mask-image:linear-gradient(var(--scroll-area-direction),var(--scroll-area-shadow-end))] data-shadow-start:[mask-image:linear-gradient(var(--scroll-area-direction),var(--scroll-area-shadow-start))] data-shadow-start:data-shadow-end:[mask-image:linear-gradient(var(--scroll-area-direction),var(--scroll-area-shadow-start),var(--scroll-area-shadow-end))]',
      },
    },
    hideScrollbar: {
      true: { root: '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden' },
    },
  },
})
