import { defineRecipe } from '../../theme/recipe'
import { ARIA_DISABLED_CLASS, TEXT_SIZE_VARIANT } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { BreadcrumbStyleSlot, BreadcrumbStyleVariant } from './breadcrumb.style-types'

export const breadcrumbDataAttributes = {
  link: createDataAttributes('disabled'),
  page: createDataAttributes('current'),
} satisfies DataAttributeContract<keyof BreadcrumbStyleSlot>

export const BREADCRUMB_ITEM_BASE_CLASS = 'inline-flex gap-1.5 items-center'
export const BREADCRUMB_LINK_CLASS = `${BREADCRUMB_ITEM_BASE_CLASS} transition-colors hover:text-foreground`
export const BREADCRUMB_PAGE_CLASS = `${BREADCRUMB_ITEM_BASE_CLASS} text-foreground font-normal`
export const BREADCRUMB_DISABLED_CLASS = ARIA_DISABLED_CLASS
export const BREADCRUMB_TRUNCATE_CLASS = 'min-w-0 truncate'

export const breadcrumbRecipe = /* @__PURE__ */ defineRecipe<
  BreadcrumbStyleSlot,
  BreadcrumbStyleVariant
>('breadcrumb', {
  base: {
    root: 'min-w-0 relative',
    list: 'text-muted-foreground flex gap-1.5 break-words items-center',
    item: 'inline-flex items-center',
    link: `${BREADCRUMB_LINK_CLASS} ${BREADCRUMB_DISABLED_CLASS}`,
    page: BREADCRUMB_PAGE_CLASS,
    leading: '',
    label: '',
    separator: 'inline-flex shrink-0 items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    wrap: true,
  },
  variants: {
    size: {
      sm: {
        list: TEXT_SIZE_VARIANT.sm,
      },
      md: {
        list: TEXT_SIZE_VARIANT.md,
      },
      lg: {
        list: TEXT_SIZE_VARIANT.lg,
      },
    },
    wrap: {
      true: {
        list: 'flex-wrap',
      },
      false: {
        list: 'flex-nowrap overflow-hidden',
        link: 'min-w-0',
        page: 'min-w-0',
        label: BREADCRUMB_TRUNCATE_CLASS,
      },
    },
  },
})
