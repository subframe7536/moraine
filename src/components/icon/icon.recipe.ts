import { defineRecipe } from '../../theme/recipe'

import type { IconStyleSlot } from './icon.style-types'

/**
 * Mask icons paint with `background-color: currentColor`, which forced colors mode replaces with
 * the page background. `preserve-parent-color` keeps the paint and resolves `currentColor` to the
 * parent's forced text color; `none` is the fallback where it is unsupported. In forced colors
 * mode the icon also drops its own color so it always follows the surrounding text.
 *
 * Only string (mask) icons get these classes. Element and component icons keep the default
 * forced colors behavior, so multi-color SVGs and images are still adjusted by the browser.
 */
export const ICON_MASK_FORCED_COLORS_CLASS =
  'forced-color-adjust-none forced-colors:text-inherit supports-[forced-color-adjust:preserve-parent-color]:[forced-color-adjust:preserve-parent-color]'

export const iconRecipe = /* @__PURE__ */ defineRecipe<IconStyleSlot>('icon', {
  base: {
    root: '',
  },
})
