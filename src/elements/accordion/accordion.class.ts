import { recipe } from '../../shared/style/recipe.ts'
import { COLLAPSIBLE_CONTENT_ANIMATION_CLASS } from '../collapsible/collapsible.class.ts'

export const ACCORDION_ROOT_CLASS = 'flex flex-col w-full'

export const ACCORDION_ITEM_CLASS =
  '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border data-disabled:opacity-64 data-disabled:pointer-events-none'

export const ACCORDION_HEADER_CLASS = 'flex'

export const ACCORDION_TRIGGER_CLASS =
  'group text-sm font-medium py-3 text-left outline-none border border-transparent rounded-md flex flex-1 min-w-0 w-full items-center justify-between relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none hover:underline cursor-pointer'

export const ACCORDION_LEADING_CLASS = 'shrink-0 mr-1.5'

export const ACCORDION_LABEL_CLASS = 'text-start break-words'

export const ACCORDION_TRAILING_CLASS =
  'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none transition-transform group-aria-expanded:rotate-180'

export const ACCORDION_CONTENT_CLASS = `text-sm h-[var(--mo-collapsible-content-height)] overflow-hidden data-closed:h-0 ${COLLAPSIBLE_CONTENT_ANIMATION_CLASS}`

export const ACCORDION_CONTENT_INNER_CLASS = 'pt-0 pb-4'

export const accordionRecipe = recipe({
  slots: [
    'root',
    'item',
    'header',
    'trigger',
    'leading',
    'label',
    'trailing',
    'content',
    'contentInner',
  ],
  base: {
    root: ACCORDION_ROOT_CLASS,
    item: ACCORDION_ITEM_CLASS,
    header: ACCORDION_HEADER_CLASS,
    trigger: ACCORDION_TRIGGER_CLASS,
    leading: ACCORDION_LEADING_CLASS,
    label: ACCORDION_LABEL_CLASS,
    trailing: ACCORDION_TRAILING_CLASS,
    content: ACCORDION_CONTENT_CLASS,
    contentInner: ACCORDION_CONTENT_INNER_CLASS,
  },
})
