import { slotRecipe } from '../../shared/style/recipe'

import type { SliderT } from './slider.types'

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
        track: 'w-full',
        range: 'h-full',
        divider: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
        thumb: '-translate-x-1/2 data-inverted:translate-x-1/2',
      },
      vertical: {
        root: 'flex-col h-full',
        track: 'h-full',
        range: 'w-full',
        divider: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
        thumb: 'translate-y-1/2 data-inverted:-translate-y-1/2',
      },
    },
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    variant: {
      default: {
        track: 'rounded-full',
        range: 'rounded-full',
        divider: 'bg-background',
        thumb:
          'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:(outline-none ring-3 ring-ring/50) hover:(ring-3 ring-ring/50) dark:bg-foreground data-dragging:scale-120 bg-clip-padding',
      },
      bold: {
        track: 'cursor-pointer',
        range:
          "rounded-[inherit] transition-[width,height,left,right,top,bottom] data-dragging:transition-none after:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) group-focus-within:after:opacity-100 group-hover:after:opacity-100 data-dragging:after:opacity-100 data-multiple:before:(rounded-full bg-primary-foreground/90 opacity-0 content-[''] transition-opacity absolute) data-multiple:group-focus-within:before:opacity-100 data-multiple:group-hover:before:opacity-100 data-multiple:data-dragging:before:opacity-100",
        divider: 'bg-muted-foreground/30',
        thumb: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm', variant: 'default' },
      class: { track: 'h-1' },
    },
    {
      variants: { orientation: 'horizontal', size: 'md', variant: 'default' },
      class: { track: 'h-1.25' },
    },
    {
      variants: { orientation: 'horizontal', size: 'lg', variant: 'default' },
      class: { track: 'h-1.5' },
    },
    {
      variants: { orientation: 'vertical', size: 'sm', variant: 'default' },
      class: { track: 'w-1' },
    },
    {
      variants: { orientation: 'vertical', size: 'md', variant: 'default' },
      class: { track: 'w-1.25' },
    },
    {
      variants: { orientation: 'vertical', size: 'lg', variant: 'default' },
      class: { track: 'w-1.5' },
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
      variants: { orientation: 'horizontal', size: 'sm', variant: 'bold' },
      class: {
        track: 'h-5 rounded-xs',
        range:
          'after:(h-3.5 w-0.75) [&:not([data-inverted])]:after:right-0.75 data-inverted:after:left-0.75 data-multiple:before:(h-3.5 w-0.75) [&:not([data-inverted])]:data-multiple:before:left-0.75 data-inverted:data-multiple:before:right-0.75',
        thumb: 'h-full top-0 -translate-x-1/2 w-5 data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'horizontal', size: 'md', variant: 'bold' },
      class: {
        track: 'h-6 rounded-sm',
        range:
          'after:(h-4 w-1) [&:not([data-inverted])]:after:right-1 data-inverted:after:left-1 data-multiple:before:(h-4 w-1) [&:not([data-inverted])]:data-multiple:before:left-1 data-inverted:data-multiple:before:right-1',
        thumb: 'h-full top-0 -translate-x-1/2 w-6 data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'horizontal', size: 'lg', variant: 'bold' },
      class: {
        track: 'h-7 rounded-md',
        range:
          'after:(h-4.5 w-1.25) [&:not([data-inverted])]:after:right-1.25 data-inverted:after:left-1.25 data-multiple:before:(h-4.5 w-1.25) [&:not([data-inverted])]:data-multiple:before:left-1.25 data-inverted:data-multiple:before:right-1.25',
        thumb: 'h-full top-0 -translate-x-1/2 w-7 data-inverted:translate-x-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'sm', variant: 'bold' },
      class: {
        track: 'w-5 rounded-xs',
        range:
          'after:(w-3.5 h-0.75) [&:not([data-inverted])]:after:top-0.75 data-inverted:after:bottom-0.75 data-multiple:before:(w-3.5 h-0.75) [&:not([data-inverted])]:data-multiple:before:bottom-0.75 data-inverted:data-multiple:before:top-0.75',
        thumb: 'w-full left-0 translate-y-1/2 h-5 data-inverted:-translate-y-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'md', variant: 'bold' },
      class: {
        track: 'w-6 rounded-sm',
        range:
          'after:(w-4 h-1) [&:not([data-inverted])]:after:top-1 data-inverted:after:bottom-1 data-multiple:before:(w-4 h-1) [&:not([data-inverted])]:data-multiple:before:bottom-1 data-inverted:data-multiple:before:top-1',
        thumb: 'w-full left-0 translate-y-1/2 h-6 data-inverted:-translate-y-1/2',
      },
    },
    {
      variants: { orientation: 'vertical', size: 'lg', variant: 'bold' },
      class: {
        track: 'w-7 rounded-md',
        range:
          'after:(w-4.5 h-1.25) [&:not([data-inverted])]:after:top-1.25 data-inverted:after:bottom-1.25 data-multiple:before:(w-4.5 h-1.25) [&:not([data-inverted])]:data-multiple:before:bottom-1.25 data-inverted:data-multiple:before:top-1.25',
        thumb: 'w-full left-0 translate-y-1/2 h-7 data-inverted:-translate-y-1/2',
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
      class: {
        range: 'after:(top-1/2 -translate-y-1/2) data-multiple:before:(top-1/2 -translate-y-1/2)',
        divider: 'h-1/3 w-px',
      },
    },
    {
      variants: { orientation: 'vertical', variant: 'bold' },
      class: {
        range: 'after:(left-1/2 -translate-x-1/2) data-multiple:before:(left-1/2 -translate-x-1/2)',
        divider: 'h-px w-1/3',
      },
    },
  ],
})
