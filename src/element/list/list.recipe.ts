import { defineRecipe } from '../../theme/recipe'

import type { ListStyleSlot } from './list.style-types'

export const listRecipe = /* @__PURE__ */ defineRecipe<ListStyleSlot>('list', {
  base: {
    root: '',
  },
})
