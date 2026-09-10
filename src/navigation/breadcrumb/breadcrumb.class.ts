import { slotRecipe } from '../../shared/style/recipe'

import type { BreadcrumbT } from './breadcrumb.types'

export const BREADCRUMB_LINK_CLASS =
  'transition-colors hover:text-foreground inline-flex items-center gap-1.5'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex items-center gap-1'
export const BREADCRUMB_DISABLED_CLASS = 'aria-disabled:(opacity-64 pointer-events-none)'
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'

export const breadcrumbRecipe = /* @__PURE__ */ slotRecipe<BreadcrumbT.Slot, BreadcrumbT.Variant>({
  base: {
    root: 'min-w-0 relative',
    list: 'text-sm text-muted-foreground flex gap-1.5 break-words items-center',
    item: 'inline-flex items-center gap-1',
    link: `${BREADCRUMB_LINK_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    page: `${BREADCRUMB_PAGE_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    leading: '',
    label: '',
    separator: 'text-muted-foreground inline-flex shrink-0 items-center justify-center',
  },
  defaults: {
    size: 'md',
    wrap: true,
  },
  variants: {
    size: {
      sm: {
        link: 'text-xs',
        page: 'text-xs',
      },
      md: {
        link: 'text-sm',
        page: 'text-sm',
      },
      lg: {
        link: 'text-base',
        page: 'text-base',
      },
    },
    wrap: {
      true: {
        list: 'flex-wrap',
      },
      false: {
        list: 'flex-nowrap overflow-hidden',
        link: BREADCRUMB_TRUNCATE_CLASS,
        page: BREADCRUMB_TRUNCATE_CLASS,
        label: BREADCRUMB_TRUNCATE_CLASS,
      },
    },
  },
} as const)
