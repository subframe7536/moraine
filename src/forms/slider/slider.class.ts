import type { SlotRecipeOptions, VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { SliderT } from './slider.types.ts'

export const sliderRecipeOptions = {
  base: {
    root: 'group flex select-none items-center relative touch-none data-disabled:opacity-64 data-disabled:pointer-events-none',
    track: 'bg-input select-none translate-z-0 relative overflow-hidden',
    range: 'bg-primary select-none absolute z-raised',
    divider: 'pointer-events-none absolute',
    thumb: 'shrink-0 block select-none absolute z-control touch-none',
  },
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
    inverted: false,
    multiple: false,
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
    inverted: {
      true: {},
      false: {},
    },
    multiple: {
      true: {},
      false: {},
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
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class: {
        range:
          'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:left-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class: {
        range:
          'after:h-[var(--s-len)] after:w-[var(--s-offset)] after:top-1/2 after:-translate-y-1/2 after:right-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class: {
        range:
          'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:bottom-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class: {
        range:
          'after:w-[var(--s-len)] after:h-[var(--s-offset)] after:left-1/2 after:-translate-x-1/2 after:top-[var(--s-pos)]',
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:left-[var(--s-offset)] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:h-[var(--s-len)] before:w-[var(--s-offset)] before:top-1/2 before:-translate-y-1/2 before:right-[var(--s-offset)] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:bottom-[var(--s-offset)] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold', multiple: true },
      class: {
        range:
          "before:rounded-full before:bg-primary-foreground/90 before:opacity-0 before:content-[''] before:transition-opacity before:absolute group-focus-within:before:opacity-100 group-hover:before:opacity-100 before:w-[var(--s-len)] before:h-[var(--s-offset)] before:left-1/2 before:-translate-x-1/2 before:top-[var(--s-offset)] duration-[var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))] ease-[cubic-bezier(0.16,1,0.3,1)]",
      },
    },
    {
      variants: { orientation: 'horizontal', variant: 'default' },
      class: { divider: 'h-full w-px' },
    },
    {
      variants: { orientation: 'vertical', variant: 'default' },
      class: { divider: 'h-px w-full' },
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      class: { divider: 'h-1/3 w-px' },
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: { divider: 'h-px w-1/3' },
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
      variants: { orientation: 'horizontal', inverted: false, variant: 'default' },
      class: { thumb: '-translate-x-1/2' },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'default' },
      class: { thumb: 'translate-x-1/2' },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'default' },
      class: { thumb: 'translate-y-1/2' },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'default' },
      class: { thumb: '-translate-y-1/2' },
    },
    {
      variants: { orientation: 'horizontal', inverted: false, variant: 'bold' },
      class: { thumb: 'h-full top-0 -translate-x-1/2 w-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'horizontal', inverted: true, variant: 'bold' },
      class: { thumb: 'h-full top-0 translate-x-1/2 w-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'vertical', inverted: false, variant: 'bold' },
      class: { thumb: 'w-full left-0 translate-y-1/2 h-[var(--s-size)]' },
    },
    {
      variants: { orientation: 'vertical', inverted: true, variant: 'bold' },
      class: { thumb: 'w-full left-0 -translate-y-1/2 h-[var(--s-size)]' },
    },
  ],
} as const satisfies SlotRecipeOptions<keyof SliderT.Slot>

export const sliderRecipe = recipe(sliderRecipeOptions)

export type SliderVariantProps = VariantProps<typeof sliderRecipe>
