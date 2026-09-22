import { createDataAttributes } from '../../shared/style-contract.ts'
import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { BreadcrumbStyleSlot, BreadcrumbStyleVariant } from './breadcrumb.style-types'

export const breadcrumbDataAttributes = {
  page: createDataAttributes('current', 'disabled'),
} satisfies DataAttributeContract<keyof BreadcrumbStyleSlot>

export const BREADCRUMB_LINK_CLASS =
  'transition-colors hover:text-foreground inline-flex items-center gap-1.5'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex items-center gap-1'
export const BREADCRUMB_DISABLED_CLASS = 'aria-disabled:(opacity-64 pointer-events-none)'
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'

export const breadcrumbRecipe = /* @__PURE__ */ defineRecipe<
  BreadcrumbStyleSlot,
  BreadcrumbStyleVariant
>('breadcrumb', {
  base: {
    root: 'min-w-0 relative',
    list: 'text-muted-foreground flex gap-1.5 break-words items-center',
    item: 'inline-flex items-center gap-1',
    link: `${BREADCRUMB_LINK_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    page: `${BREADCRUMB_PAGE_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    leading: '',
    label: '',
    separator: 'text-muted-foreground inline-flex shrink-0 items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    wrap: true,
  },
  variants: {
    size: {
      sm: {
        list: 'text-xs',
      },
      md: {
        list: 'text-sm',
      },
      lg: {
        list: 'text-base',
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
})
