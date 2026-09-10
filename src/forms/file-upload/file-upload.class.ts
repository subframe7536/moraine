import { slotRecipe } from '../../shared/style/recipe.ts'

import type { FileUploadT } from './file-upload.types.ts'

export const fileUploadRecipe = /* @__PURE__ */ slotRecipe<FileUploadT.Slot, FileUploadT.Variant>({
  base: {
    root: 'relative flex min-w-0 flex-col data-disabled:(pointer-events-none opacity-64)',
    control:
      'relative inline-flex max-w-full cursor-pointer items-center justify-center self-start rounded-md border border-input bg-background text-left shadow-xs outline-none transition-[colors,box-shadow] hover:bg-muted focus-visible:(border-ring ring-3 ring-ring/50) data-dropzone:(w-full self-stretch rounded-lg border-dashed shadow-none text-center) data-dragging:(border-primary bg-muted) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:bg-input/30 dark:data-invalid:(border-destructive/50 ring-destructive/40) aria-readonly:(cursor-default hover:bg-background) dark:aria-readonly:hover:bg-input/30',
    wrapper:
      'pointer-events-none grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 data-dropzone:(flex flex-col justify-center text-center)',
    icon: 'row-span-2 shrink-0 text-muted-foreground',
    label: 'col-start-2 min-w-0 font-medium text-foreground [overflow-wrap:anywhere]',
    description: 'col-start-2 min-w-0 text-muted-foreground [overflow-wrap:anywhere]',
    files: 'flex min-w-0 flex-col',
    file: 'relative flex min-w-0 items-center rounded-lg border border-border bg-background text-foreground',
    filePreview:
      'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground [&>img]:(size-full object-cover)',
    fileMeta: 'flex min-w-0 flex-1 flex-col gap-0.5',
    fileName: 'truncate font-medium text-foreground',
    fileSize: 'truncate text-xs text-muted-foreground',
    fileRemove:
      'inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:(bg-muted-hover text-foreground) focus-visible:(outline-none border-ring ring-3 ring-ring/50) active:bg-muted-active disabled:(pointer-events-none opacity-64)',
  },
  defaults: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        root: 'gap-2',
        control: 'px-3 py-2 text-xs data-dropzone:(min-h-32 px-4 py-5)',
        wrapper: 'gap-y-0.5 data-dropzone:gap-1',
        icon: 'text-base',
        label: 'text-xs',
        description: 'text-xs',
        files: 'gap-2',
        file: 'gap-2 p-2',
        filePreview: 'size-8',
        fileName: 'text-xs',
        fileRemove: 'size-7 text-sm',
      },
      md: {
        root: 'gap-3',
        control: 'px-3 py-2 text-sm data-dropzone:(min-h-40 px-6 py-6)',
        wrapper: 'gap-y-0.5 data-dropzone:gap-2',
        icon: 'text-xl',
        label: 'text-sm',
        description: 'text-xs',
        files: 'gap-2',
        file: 'gap-3 p-3',
        filePreview: 'size-10',
        fileName: 'text-sm',
        fileRemove: 'size-8 text-base',
      },
      lg: {
        root: 'gap-3',
        control: 'px-4 py-2.5 text-base data-dropzone:(min-h-48 px-8 py-8)',
        wrapper: 'gap-x-3 gap-y-1 data-dropzone:gap-2',
        icon: 'text-2xl',
        label: 'text-base',
        description: 'text-sm',
        files: 'gap-3',
        file: 'gap-3 p-3',
        filePreview: 'size-12',
        fileName: 'text-base',
        fileRemove: 'size-9 text-lg',
      },
    },
  },
})
