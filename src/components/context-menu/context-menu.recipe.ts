import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import {
  overlayMenuDataAttributes,
  overlayMenuRecipeOptions,
} from '../shared/overlay/menu/menu.recipe'
import { overlayTriggerDataAttributes } from '../shared/overlay/trigger.recipe'

import type { ContextMenuStyleSlot, ContextMenuStyleVariants } from './context-menu.style-types'

export const CONTEXT_MENU_TRIGGER_CLASS = '[-webkit-touch-callout:none]'

export const contextMenuDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
} satisfies DataAttributeContract<keyof ContextMenuStyleSlot>

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  ContextMenuStyleSlot,
  ContextMenuStyleVariants
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
