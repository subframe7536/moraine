import { recipe } from '../../shared/style/recipe.ts'
import { COLLAPSIBLE_CONTENT_ANIMATION_CLASS } from '../collapsible/collapsible.class.ts'

export const accordionRecipe = recipe({
  base: {
    root: 'flex flex-col w-full',
    item: '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border data-disabled:opacity-64 data-disabled:pointer-events-none',
    header: 'flex',
    trigger:
      'group text-sm font-medium py-3 text-left outline-none border border-transparent rounded-md flex flex-1 min-w-0 w-full items-center justify-between relative focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none hover:underline cursor-pointer',
    leading: 'shrink-0 mr-1.5',
    label: 'text-start break-words',
    trailing:
      'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none transition-transform group-aria-expanded:rotate-180',
    content: `text-sm h-[var(--mo-collapsible-content-height)] overflow-hidden data-closed:h-0 ${COLLAPSIBLE_CONTENT_ANIMATION_CLASS}`,
    contentInner: 'pt-0 pb-4',
  },
})
