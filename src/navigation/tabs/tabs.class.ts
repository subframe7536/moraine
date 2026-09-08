import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { TabsT } from './tabs.types.ts'

export const tabsRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'flex gap-2',
      'data-[orientation=vertical]:flex-row data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:w-full',
    ),
    list: /* @__PURE__ */ cn(
      'p-1 inline-flex items-center relative',
      'data-[orientation=vertical]:flex-col data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-fit',
    ),
    indicator: /* @__PURE__ */ cn(
      'rounded-md transition-[transform,width,height] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] absolute',
      'data-[orientation=horizontal]:left-0 data-[orientation=vertical]:top-0',
    ),
    trigger: /* @__PURE__ */ cn(
      'text-muted-foreground font-medium px-2 py-1.5 outline-none inline-flex gap-1.5 min-w-0 cursor-pointer transition-colors duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)] items-center justify-center relative hover:text-foreground focus-visible:outline-none focus-visible:border-ring disabled:opacity-64 disabled:pointer-events-none focus-visible:ring-3 focus-visible:ring-ring/50',
      'data-[orientation=horizontal]:flex-1 data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start',
    ),
    leading: 'inline-flex shrink-0 items-center justify-center',
    label: 'truncate',
    trailing: '',
    content: 'text-sm outline-none w-full',
  },
  defaults: {
    variant: 'pill',
    size: 'md',
  },
  variants: {
    variant: {
      pill: {
        list: 'rounded-lg bg-muted',
        indicator: 'border border-border bg-background shadow-xs',
      },
      link: {
        list: 'rounded-none bg-transparent',
        indicator: 'bg-primary',
        trigger: 'data-selected:text-primary hover:data-highlighted:not-disabled:text-foreground',
      },
    },
    size: {
      sm: {
        trigger: 'text-xs',
      },
      md: {
        trigger: 'text-sm',
      },
      lg: {
        trigger: 'text-base',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'pill' },
      class: { indicator: 'data-[orientation=horizontal]:inset-y-1' },
    },
    {
      variants: { variant: 'pill' },
      class: { indicator: 'data-[orientation=vertical]:inset-x-1' },
    },
    {
      variants: { variant: 'link' },
      class: {
        indicator:
          'data-[orientation=horizontal]:bottom-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:rounded-full',
      },
    },
    {
      variants: { variant: 'link' },
      class: {
        indicator:
          'data-[orientation=vertical]:right-0 data-[orientation=vertical]:w-px data-[orientation=vertical]:rounded-full',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof TabsT.Slot>

export const tabsRecipe = /* @__PURE__ */ slotRecipe(tabsRecipeOptions)
