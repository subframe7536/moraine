import { defineRecipe } from '../../shared/style/recipe'

import type { IconT } from './icon.types'

export const iconRecipe = /* @__PURE__ */ defineRecipe<'icon', IconT.Slot>('icon', {
  base: {
    root: '',
  },
})
