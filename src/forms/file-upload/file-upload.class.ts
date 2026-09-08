import { slotRecipe } from '../../shared/style/recipe.ts'

import type { FileUploadT } from './file-upload.types.ts'

export const fileUploadRecipe = /* @__PURE__ */ slotRecipe<keyof FileUploadT.Slot>({
  base: {
    root: 'flex flex-col relative data-disabled:(opacity-64 pointer-events-none)',
    control:
      'text-center outline-none border border-input rounded-lg bg-background inline-flex w-full cursor-pointer shadow-xs transition-[colors,box-shadow] items-center justify-center relative hover:(bg-muted/40 border-muted-foreground/40) focus-visible:(outline-none border-ring ring-3 ring-ring/50) data-dragging:(border-primary bg-muted/40) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:bg-input/30 dark:data-invalid:(border-destructive/50 ring-destructive/40) [&:not([data-dropzone])]:border-solid data-dropzone:(border-2 border-dashed)',
    wrapper: 'text-center flex flex-col pointer-events-none items-center justify-center',
    icon: 'text-muted-foreground',
    label: 'text-foreground font-medium',
    description: 'text-muted-foreground',
    files: 'flex flex-col',
    file: 'text-card-foreground border border-border rounded-lg bg-card flex transition-colors items-center relative shadow-xs',
    filePreview:
      '[&>img]:(size-full object-cover) text-muted-foreground rounded-md border border-border bg-muted/50 flex shrink-0 items-center justify-center relative overflow-hidden',
    fileMeta: 'flex flex-1 flex-col min-w-0',
    fileName: 'text-foreground font-medium truncate',
    fileSize: 'text-muted-foreground mt-0.5 truncate',
    fileRemove:
      'text-muted-foreground border border-transparent rounded-md inline-flex transition-colors items-center justify-center hover:(text-foreground bg-muted) focus-visible:(outline-none border-ring ring-3 ring-ring/50) active:bg-muted-active',
  },
  defaults: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        root: 'gap-2',
        control: 'text-xs px-4 py-4 gap-2 min-h-24',
        wrapper: 'gap-1',
        icon: 'text-base',
        label: 'text-xs',
        description: 'text-xs',
        files: 'gap-1.5',
        file: 'p-2 gap-2',
        filePreview: 'size-8',
        fileMeta: 'gap-0.5',
        fileName: 'text-xs',
        fileSize: 'text-xs',
        fileRemove: 'text-xs size-5',
      },
      md: {
        root: 'gap-2.5',
        control: 'text-sm px-6 py-6 gap-2 min-h-28',
        wrapper: 'gap-1.5',
        icon: 'text-lg',
        label: 'text-sm',
        description: 'text-xs',
        files: 'gap-2',
        file: 'p-2.5 gap-3',
        filePreview: 'size-10',
        fileMeta: 'gap-0.5',
        fileName: 'text-sm',
        fileSize: 'text-xs',
        fileRemove: 'text-sm size-6',
      },
      lg: {
        root: 'gap-3',
        control: 'text-sm px-8 py-8 gap-2.5 min-h-32',
        wrapper: 'gap-2',
        icon: 'text-xl',
        label: 'text-base',
        description: 'text-sm',
        files: 'gap-2',
        file: 'p-3 gap-3',
        filePreview: 'size-12',
        fileMeta: 'gap-1',
        fileName: 'text-base',
        fileSize: 'text-xs',
        fileRemove: 'text-sm size-7',
      },
    },
  },
})
