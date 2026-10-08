import { POPPER_CONTENT_MAX_SIZE_CLASS } from '../../overlay/base/popper.class'
import { defineRecipe } from '../../theme/recipe'
import {
  DATA_DISABLED_CLASS,
  FOCUS_VISIBLE_RING_CLASS,
  VISUALLY_HIDDEN_CLASS,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type {
  NavigationMenuStyleSlot,
  NavigationMenuStyleVariant,
} from './navigation-menu.style-types'

export const NAVIGATION_MENU_POSITIONER_CLASS = `${POPPER_CONTENT_MAX_SIZE_CLASS} transition-none z-floating data-positioned:transition-transform`
export const NAVIGATION_MENU_PANEL_CLASS = `text-popover-foreground border border-border rounded-md bg-popover ${POPPER_CONTENT_MAX_SIZE_CLASS} shadow-overlay origin-(--mo-popper-content-transform-origin) transition-[width,height] relative overflow-hidden motion-reduce:transition-none data-closed:(animate-mo-exit exit-opacity-0 exit-scale-90) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-90)`
export const NAVIGATION_MENU_FOCUS_GUARD_CLASS = VISUALLY_HIDDEN_CLASS

export const navigationMenuPanelDataAttributes = /* @__PURE__ */ createDataAttributes(
  'side',
  'align',
)

export const navigationMenuDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'orientation'),
  list: /* @__PURE__ */ createDataAttributes('orientation'),
  item: /* @__PURE__ */ createDataAttributes('disabled', 'expanded'),
  trigger: /* @__PURE__ */ createDataAttributes('disabled', 'expanded'),
  triggerIcon: /* @__PURE__ */ createDataAttributes('expanded'),
  content: /* @__PURE__ */ createDataAttributes('expanded', 'closed', 'orientation'),
  link: /* @__PURE__ */ createDataAttributes('active', 'disabled'),
} satisfies DataAttributeContract<keyof NavigationMenuStyleSlot>

export const navigationMenuRecipe = /* @__PURE__ */ defineRecipe<
  NavigationMenuStyleSlot,
  NavigationMenuStyleVariant
>('navigationMenu', {
  base: {
    root: 'max-w-max relative',
    list: 'm-0 p-0 list-none flex gap-1',
    item: 'relative',
    trigger: `text-sm text-foreground font-medium px-3 outline-none rounded-md bg-background inline-flex gap-1.5 h-9 items-center justify-center data-expanded:bg-muted hover:bg-muted-hover ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
    triggerIcon: 'transition-transform data-expanded:rotate-180 motion-reduce:transition-none',
    content: `p-1 outline-none ${POPPER_CONTENT_MAX_SIZE_CLASS} w-fit left-0 top-0 absolute overflow-auto enter-opacity-0 exit-opacity-0 enter-scale-100 exit-scale-100 data-closed:(pointer-events-none animate-mo-exit) data-expanded:animate-mo-enter`,
    link: `text-sm text-foreground p-2 outline-none rounded-sm flex flex-col gap-1 data-active:bg-muted hover:bg-muted-hover ${FOCUS_VISIBLE_RING_CLASS}  ${DATA_DISABLED_CLASS}`,
    '--mo-anim-ease': 'ease',
  },
  defaultVariants: { orientation: 'horizontal' },
  variants: {
    orientation: {
      horizontal: { list: 'flex-row items-center' },
      vertical: {
        list: 'flex-col items-stretch',
        trigger: 'w-full justify-between',
        triggerIcon:
          '-rotate-90 data-expanded:rotate-90 rtl:rotate-90 rtl:data-expanded:-rotate-90',
      },
    },
  },
})
