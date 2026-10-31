import { ICON_MASK_CLASS } from '../../theme/icons'
import { defineRecipe } from '../../theme/recipe'

import type { IconInternalVariants, IconStyleSlot } from './icon.style-types'

export const iconRecipe = /* @__PURE__ */ defineRecipe<IconStyleSlot, IconInternalVariants>(
  'icon',
  {
    base: {
      root: '',
    },
    variants: {
      isMask: {
        /**
         * A string `name` is a mask icon class that sizes itself. Only mask icons get the forced
         * colors shortcut; element and component icons keep the default forced colors behavior,
         * so multi-color SVGs and images are still adjusted by the browser.
         */
        true: {
          root: `block ${ICON_MASK_CLASS}`,
        },
        /**
         * A JSX or component `name` renders inside a `1.2em` host box that follows the font size.
         * The graphic fills the host, so a size class on the host resizes the graphic too.
         */
        false: {
          root: 'flex shrink-0 size-[1.2em] items-center justify-center *:size-full',
        },
      },
    },
  },
)
