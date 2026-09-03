import { recipe } from '../../shared/style/recipe.ts'

export const COLLAPSIBLE_ROOT_CLASS = ''
export const COLLAPSIBLE_TRIGGER_CLASS = 'cursor-pointer'

export const COLLAPSIBLE_CONTENT_CLASS =
  'h-[var(--mo-collapsible-content-height)] overflow-hidden data-closed:h-0'

export const COLLAPSIBLE_CONTENT_ANIMATION_CLASS =
  'data-expanded:animate-accordion-down data-closed:animate-accordion-up motion-reduce:animate-none'

export const collapsibleRecipe = recipe({
  slots: ['root', 'trigger', 'content'],
  base: {
    root: COLLAPSIBLE_ROOT_CLASS,
    trigger: COLLAPSIBLE_TRIGGER_CLASS,
    content: `${COLLAPSIBLE_CONTENT_CLASS} ${COLLAPSIBLE_CONTENT_ANIMATION_CLASS}`,
  },
})
