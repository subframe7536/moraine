import { createSlotRecipe } from '../shared/style/recipe.ts'

import { SLOT_SKELETONS } from './slots.ts'
import type { MoraineDesign } from './types.ts'

/** Empty slot bindings do not import or compile the official presentation. */
const emptyDesign = Object.freeze(
  Object.fromEntries(
    Object.entries(SLOT_SKELETONS).map(([key, slots]) => [
      key,
      {
        recipe: createSlotRecipe({ base: Object.fromEntries(slots.map((slot) => [slot, ''])) }),
        defaultVariants: undefined,
      },
    ]),
  ),
) as unknown as MoraineDesign

export function getEmptyDesign(): MoraineDesign {
  return emptyDesign
}
