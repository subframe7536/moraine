import { defineRecipe } from '../../theme/style/recipe'

import type { CollapsibleStyleSlot } from './collapsible.style-types'

export const collapsibleRecipe = /* @__PURE__ */ defineRecipe<CollapsibleStyleSlot>('collapsible', {
  base: {
    root: '',
    trigger: '',
    content: '',
  },
})
