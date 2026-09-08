import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { SliderT } from './slider.types.ts'

export const sliderRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'group flex select-none items-center relative touch-none data-disabled:opacity-64 data-disabled:pointer-events-none',
      'data-[orientation=vertical]:flex-col data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full',
    ),
    track: /* @__PURE__ */ cn(
      'bg-input select-none translate-z-0 relative overflow-hidden',
      'data-[orientation=horizontal]:h-[var(--s-size)] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[var(--s-size)]',
    ),
    range: /* @__PURE__ */ cn(
      'bg-primary select-none absolute z-raised',
      'data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
    ),
    divider: /* @__PURE__ */ cn(
      'pointer-events-none absolute',
      'data-[orientation=horizontal]:top-1/2 data-[orientation=vertical]:left-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=horizontal]:-translate-y-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:-translate-y-1/2',
    ),
    thumb: 'shrink-0 block select-none absolute z-control touch-none',
  },
  defaults: {
    size: 'md',
    variant: 'default',
  },
  variants: {
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
          'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:ring-3 hover:ring-ring/50 dark:bg-foreground data-dragging:scale-120 [html:not(.dark)_&]:bg-clip-padding duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]',
      },
      bold: {
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:rounded-full after:bg-primary-foreground/90 after:opacity-0 after:content-[''] after:transition-opacity after:absolute group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
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
      variants: { variant: 'bold' },
      class: {
        range:
          'data-[orientation=horizontal]:[&:not([data-inverted])]:after:h-[var(--s-len)] data-[orientation=horizontal]:[&:not([data-inverted])]:after:w-[var(--s-offset)] data-[orientation=horizontal]:[&:not([data-inverted])]:after:top-1/2 data-[orientation=horizontal]:[&:not([data-inverted])]:after:-translate-y-1/2 data-[orientation=horizontal]:[&:not([data-inverted])]:after:left-[var(--s-pos)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          'data-[orientation=horizontal]:data-inverted:after:h-[var(--s-len)] data-[orientation=horizontal]:data-inverted:after:w-[var(--s-offset)] data-[orientation=horizontal]:data-inverted:after:top-1/2 data-[orientation=horizontal]:data-inverted:after:-translate-y-1/2 data-[orientation=horizontal]:data-inverted:after:right-[var(--s-pos)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          'data-[orientation=vertical]:[&:not([data-inverted])]:after:w-[var(--s-len)] data-[orientation=vertical]:[&:not([data-inverted])]:after:h-[var(--s-offset)] data-[orientation=vertical]:[&:not([data-inverted])]:after:left-1/2 data-[orientation=vertical]:[&:not([data-inverted])]:after:-translate-x-1/2 data-[orientation=vertical]:[&:not([data-inverted])]:after:bottom-[var(--s-pos)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          'data-[orientation=vertical]:data-inverted:after:w-[var(--s-len)] data-[orientation=vertical]:data-inverted:after:h-[var(--s-offset)] data-[orientation=vertical]:data-inverted:after:left-1/2 data-[orientation=vertical]:data-inverted:after:-translate-x-1/2 data-[orientation=vertical]:data-inverted:after:top-[var(--s-pos)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          "data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:rounded-full data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:bg-primary-foreground/90 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:opacity-0 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:content-[''] data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:transition-opacity data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:absolute data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:group-focus-within:before:opacity-100 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:group-hover:before:opacity-100 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:h-[var(--s-len)] data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:w-[var(--s-offset)] data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:top-1/2 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:-translate-y-1/2 data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:before:left-[var(--s-offset)] data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] data-[orientation=horizontal]:[&:not([data-inverted])]:data-multiple:ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          "data-[orientation=horizontal]:data-inverted:data-multiple:before:rounded-full data-[orientation=horizontal]:data-inverted:data-multiple:before:bg-primary-foreground/90 data-[orientation=horizontal]:data-inverted:data-multiple:before:opacity-0 data-[orientation=horizontal]:data-inverted:data-multiple:before:content-[''] data-[orientation=horizontal]:data-inverted:data-multiple:before:transition-opacity data-[orientation=horizontal]:data-inverted:data-multiple:before:absolute data-[orientation=horizontal]:data-inverted:data-multiple:group-focus-within:before:opacity-100 data-[orientation=horizontal]:data-inverted:data-multiple:group-hover:before:opacity-100 data-[orientation=horizontal]:data-inverted:data-multiple:before:h-[var(--s-len)] data-[orientation=horizontal]:data-inverted:data-multiple:before:w-[var(--s-offset)] data-[orientation=horizontal]:data-inverted:data-multiple:before:top-1/2 data-[orientation=horizontal]:data-inverted:data-multiple:before:-translate-y-1/2 data-[orientation=horizontal]:data-inverted:data-multiple:before:right-[var(--s-offset)] data-[orientation=horizontal]:data-inverted:data-multiple:duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] data-[orientation=horizontal]:data-inverted:data-multiple:ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          "data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:rounded-full data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:bg-primary-foreground/90 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:opacity-0 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:content-[''] data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:transition-opacity data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:absolute data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:group-focus-within:before:opacity-100 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:group-hover:before:opacity-100 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:w-[var(--s-len)] data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:h-[var(--s-offset)] data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:left-1/2 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:-translate-x-1/2 data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:before:bottom-[var(--s-offset)] data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] data-[orientation=vertical]:[&:not([data-inverted])]:data-multiple:ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        range:
          "data-[orientation=vertical]:data-inverted:data-multiple:before:rounded-full data-[orientation=vertical]:data-inverted:data-multiple:before:bg-primary-foreground/90 data-[orientation=vertical]:data-inverted:data-multiple:before:opacity-0 data-[orientation=vertical]:data-inverted:data-multiple:before:content-[''] data-[orientation=vertical]:data-inverted:data-multiple:before:transition-opacity data-[orientation=vertical]:data-inverted:data-multiple:before:absolute data-[orientation=vertical]:data-inverted:data-multiple:group-focus-within:before:opacity-100 data-[orientation=vertical]:data-inverted:data-multiple:group-hover:before:opacity-100 data-[orientation=vertical]:data-inverted:data-multiple:before:w-[var(--s-len)] data-[orientation=vertical]:data-inverted:data-multiple:before:h-[var(--s-offset)] data-[orientation=vertical]:data-inverted:data-multiple:before:left-1/2 data-[orientation=vertical]:data-inverted:data-multiple:before:-translate-x-1/2 data-[orientation=vertical]:data-inverted:data-multiple:before:top-[var(--s-offset)] data-[orientation=vertical]:data-inverted:data-multiple:duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] data-[orientation=vertical]:data-inverted:data-multiple:ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { variant: 'default' },
      class: { divider: 'data-[orientation=horizontal]:h-full data-[orientation=horizontal]:w-px' },
    },
    {
      variants: { variant: 'default' },
      class: { divider: 'data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full' },
    },
    {
      variants: { variant: 'bold' },
      class: { divider: 'data-[orientation=horizontal]:h-1/3 data-[orientation=horizontal]:w-px' },
    },
    {
      variants: { variant: 'bold' },
      class: { divider: 'data-[orientation=vertical]:h-px data-[orientation=vertical]:w-1/3' },
    },
    {
      variants: { size: 'sm', variant: 'default' },
      class: { thumb: 'size-3' },
    },
    {
      variants: { size: 'md', variant: 'default' },
      class: { thumb: 'size-3.5' },
    },
    {
      variants: { size: 'lg', variant: 'default' },
      class: { thumb: 'size-4' },
    },
    {
      variants: { variant: 'default' },
      class: { thumb: 'data-[orientation=horizontal]:[&:not([data-inverted])]:-translate-x-1/2' },
    },
    {
      variants: { variant: 'default' },
      class: { thumb: 'data-[orientation=horizontal]:data-inverted:translate-x-1/2' },
    },
    {
      variants: { variant: 'default' },
      class: { thumb: 'data-[orientation=vertical]:[&:not([data-inverted])]:translate-y-1/2' },
    },
    {
      variants: { variant: 'default' },
      class: { thumb: 'data-[orientation=vertical]:data-inverted:-translate-y-1/2' },
    },
    {
      variants: { variant: 'bold' },
      class: {
        thumb:
          'data-[orientation=horizontal]:[&:not([data-inverted])]:h-full data-[orientation=horizontal]:[&:not([data-inverted])]:top-0 data-[orientation=horizontal]:[&:not([data-inverted])]:-translate-x-1/2 data-[orientation=horizontal]:[&:not([data-inverted])]:w-[var(--s-size)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        thumb:
          'data-[orientation=horizontal]:data-inverted:h-full data-[orientation=horizontal]:data-inverted:top-0 data-[orientation=horizontal]:data-inverted:translate-x-1/2 data-[orientation=horizontal]:data-inverted:w-[var(--s-size)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        thumb:
          'data-[orientation=vertical]:[&:not([data-inverted])]:w-full data-[orientation=vertical]:[&:not([data-inverted])]:left-0 data-[orientation=vertical]:[&:not([data-inverted])]:translate-y-1/2 data-[orientation=vertical]:[&:not([data-inverted])]:h-[var(--s-size)]',
      },
    },
    {
      variants: { variant: 'bold' },
      class: {
        thumb:
          'data-[orientation=vertical]:data-inverted:w-full data-[orientation=vertical]:data-inverted:left-0 data-[orientation=vertical]:data-inverted:-translate-y-1/2 data-[orientation=vertical]:data-inverted:h-[var(--s-size)]',
      },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof SliderT.Slot>

export const sliderRecipe = /* @__PURE__ */ slotRecipe(sliderRecipeOptions)
