import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SliderT } from './slider.types.ts'

export const sliderRecipeOptions = {
  base: {
    root: 'group flex select-none items-center relative touch-none data-disabled:(opacity-64 pointer-events-none)',
    track: 'bg-input select-none translate-z-0 relative overflow-hidden',
    range: 'bg-primary select-none absolute z-raised',
    divider: 'pointer-events-none absolute',
    thumb: 'shrink-0 block select-none absolute z-control touch-none',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'w-full',
        track: 'h-[var(--s-size)] w-full',
        range: 'h-full',
        divider: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      vertical: {
        root: 'flex-col h-full',
        track: 'h-full w-[var(--s-size)]',
        range: 'w-full',
        divider: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
      },
    },
    size: {
      sm: { root: '[--s-size:4px]' },
      md: { root: '[--s-size:5px]' },
      lg: { root: '[--s-size:6px]' },
    },
    variant: {
      default: {
        track: 'rounded-full',
        range: 'rounded-full',
        divider: 'bg-background',
        thumb:
          'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:(outline-none ring-3 ring-ring/50) hover:(ring-3 ring-ring/50) dark:bg-foreground data-dragging:scale-120 [html:not(.dark)_&]:bg-clip-padding duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
      },
      bold: {
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none data-multiple:before:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) data-multiple:group-focus-within:before:opacity-100 data-multiple:group-hover:before:opacity-100 data-multiple:(duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]) duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
        divider: 'bg-muted-foreground/30',
        thumb: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
      },
    },
  },
  compoundVariants: [
    {
      variants: { size: 'sm', variant: 'bold' },
      class: {
        root: '[--s-size:20px] [--s-len:14px] [--s-offset:3px] [--s-pos:max(3px,calc(100%_-_6px))]',
        track: 'rounded-xs',
      },
    },
    {
      variants: { size: 'md', variant: 'bold' },
      class: {
        root: '[--s-size:24px] [--s-len:16px] [--s-offset:4px] [--s-pos:max(4px,calc(100%_-_8px))]',
        track: 'rounded-sm',
      },
    },
    {
      variants: { size: 'lg', variant: 'bold' },
      class: {
        root: '[--s-size:28px] [--s-len:18px] [--s-offset:5px] [--s-pos:max(5px,calc(100%_-_10px))]',
        track: 'rounded-md',
      },
    },
    {
      variants: { orientation: 'horizontal', variant: 'default' },
      class: {
        divider: 'h-full w-px',
        thumb: '[&:not([data-inverted])]:-translate-x-1/2 data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', variant: 'default' },
      class: {
        divider: 'h-px w-full',
        thumb: '[&:not([data-inverted])]:translate-y-1/2 data-inverted:-translate-y-1/2',
      },
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      class: {
        range:
          '[&:not([data-inverted])]:after:(h-[var(--s-len)] w-[var(--s-offset)] top-1/2 -translate-y-1/2 left-[var(--s-pos)]) data-inverted:after:(h-[var(--s-len)] w-[var(--s-offset)] top-1/2 -translate-y-1/2 right-[var(--s-pos)]) [&:not([data-inverted])]:data-multiple:before:(h-[var(--s-len)] w-[var(--s-offset)] top-1/2 -translate-y-1/2 left-[var(--s-offset)]) data-inverted:data-multiple:before:(h-[var(--s-len)] w-[var(--s-offset)] top-1/2 -translate-y-1/2 right-[var(--s-offset)])',
        divider: 'h-1/3 w-px',
        thumb:
          '[&:not([data-inverted])]:h-full [&:not([data-inverted])]:top-0 [&:not([data-inverted])]:-translate-x-1/2 [&:not([data-inverted])]:w-[var(--s-size)] data-inverted:(h-full top-0 translate-x-1/2 w-[var(--s-size)])',
      },
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: {
        range:
          '[&:not([data-inverted])]:after:(w-[var(--s-len)] h-[var(--s-offset)] left-1/2 -translate-x-1/2 bottom-[var(--s-pos)]) data-inverted:after:(w-[var(--s-len)] h-[var(--s-offset)] left-1/2 -translate-x-1/2 top-[var(--s-pos)]) [&:not([data-inverted])]:data-multiple:before:(w-[var(--s-len)] h-[var(--s-offset)] left-1/2 -translate-x-1/2 bottom-[var(--s-offset)]) data-inverted:data-multiple:before:(w-[var(--s-len)] h-[var(--s-offset)] left-1/2 -translate-x-1/2 top-[var(--s-offset)])',
        divider: 'h-px w-1/3',
        thumb:
          '[&:not([data-inverted])]:w-full [&:not([data-inverted])]:left-0 [&:not([data-inverted])]:translate-y-1/2 [&:not([data-inverted])]:h-[var(--s-size)] data-inverted:(w-full left-0 -translate-y-1/2 h-[var(--s-size)])',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof SliderT.Slot>

export const sliderRecipe = /* @__PURE__ */ slotRecipe(sliderRecipeOptions)
