import { defineRecipe } from '../../theme/recipe'
import { ARIA_DISABLED_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { BreadcrumbStyleSlot, BreadcrumbStyleVariant } from './breadcrumb.style-types'

export const breadcrumbDataAttributes = {
  page: createDataAttributes('current', 'disabled'),
} satisfies DataAttributeContract<keyof BreadcrumbStyleSlot>

export const BREADCRUMB_LINK_CLASS =
  'inline-flex gap-1.5 transition-colors items-center hover:text-foreground'
export const BREADCRUMB_PAGE_CLASS = 'text-foreground font-normal inline-flex gap-1 items-center'
export const BREADCRUMB_DISABLED_CLASS = `${ARIA_DISABLED_CLASS}`
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'

export const breadcrumbRecipe = /* @__PURE__ */ defineRecipe<
  BreadcrumbStyleSlot,
  BreadcrumbStyleVariant
>('breadcrumb', {
  base: {
    root: 'min-w-0 relative',
    list: 'text-muted-foreground flex gap-1.5 break-words items-center',
    item: 'inline-flex gap-1 items-center',
    link: `${BREADCRUMB_LINK_CLASS}  ${BREADCRUMB_DISABLED_CLASS}`,
    page: BREADCRUMB_PAGE_CLASS,
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
