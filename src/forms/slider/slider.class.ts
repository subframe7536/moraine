import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SliderT } from './slider.types.ts'

export const sliderRecipe = /* @__PURE__ */ slotRecipe<SliderT.Slot, SliderT.Variant>({
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
        track: 'h-(--s-size) w-full',
        range: 'h-full',
        divider: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      vertical: {
        root: 'flex-col h-full',
        track: 'h-full w-(--s-size)',
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
          'size-[calc(var(--s-size)_*_3)] outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:(outline-none ring-3 ring-ring/50) hover:(ring-3 ring-ring/50) dark:bg-foreground data-dragging:scale-120 bg-clip-padding',
      },
      bold: {
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] after:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:transition-none data-multiple:before:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) data-multiple:group-focus-within:before:opacity-100 data-multiple:group-hover:before:opacity-100",
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
        thumb: '-translate-x-1/2 data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', variant: 'default' },
      class: {
        divider: 'h-px w-full',
        thumb: 'translate-y-1/2 data-inverted:-translate-y-1/2',
      },
    },
    {
      variants: { orientation: 'horizontal', variant: 'bold' },
      class: {
        range:
          'after:h-(--s-len) after:w-(--s-offset) after:top-1/2 after:-translate-y-1/2 [&:not([data-inverted])]:after:left-(--s-pos) data-inverted:after:right-(--s-pos) data-multiple:before:h-(--s-len) data-multiple:before:w-(--s-offset) data-multiple:before:top-1/2 data-multiple:before:-translate-y-1/2 [&:not([data-inverted])]:data-multiple:before:left-(--s-offset) data-inverted:data-multiple:before:right-(--s-offset)',
        divider: 'h-1/3 w-px',
        thumb: 'h-full top-0 -translate-x-1/2 w-(--s-size) data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: {
        range:
          'after:w-(--s-len) after:h-(--s-offset) after:left-1/2 after:-translate-x-1/2 [&:not([data-inverted])]:after:bottom-(--s-pos) data-inverted:after:top-(--s-pos) data-multiple:before:w-(--s-len) data-multiple:before:h-(--s-offset) data-multiple:before:left-1/2 data-multiple:before:-translate-x-1/2 [&:not([data-inverted])]:data-multiple:before:bottom-(--s-offset) data-inverted:data-multiple:before:top-(--s-offset)',
        divider: 'h-px w-1/3',
        thumb: 'w-full left-0 translate-y-1/2 h-(--s-size) data-inverted:-translate-y-1/2',
      },
    },
  ],
})
