import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { FileUploadStyleSlot, FileUploadStyleVariants } from './file-upload.style-types'

export const FILE_UPLOAD_PREVIEW_IMAGE_CLASS = 'size-full object-cover'

export const fileUploadDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  control: /* @__PURE__ */ createDataAttributes('dragging', 'invalid'),
} satisfies DataAttributeContract<keyof FileUploadStyleSlot>

export const fileUploadRecipe = /* @__PURE__ */ defineRecipe<
  FileUploadStyleSlot,
  FileUploadStyleVariants
>('fileUpload', {
  base: {
    root: 'flex flex-col min-w-0 relative data-disabled:(opacity-64 pointer-events-none)',
    control: `outline-none border-2 border-input bg-control inline-flex max-w-full cursor-pointer transition-[background-color,border-color,box-shadow] items-center justify-center relative active:bg-background-active hover:bg-background-hover ${FOCUS_VISIBLE_CLASS} data-dragging:(border-primary bg-muted) ${DATA_INVALID_CLASS} dark:active:bg-background-active dark:hover:bg-background-hover ${DARK_DATA_INVALID_CLASS} aria-readonly:(cursor-default active:bg-control hover:bg-control) dark:aria-readonly:hover:bg-control`,
    wrapper: 'min-w-0 pointer-events-none items-center',
    icon: 'text-muted-foreground shrink-0 row-span-2',
    label: 'text-foreground font-medium col-start-2 min-w-0 [overflow-wrap:anywhere]',
    description: 'text-muted-foreground col-start-2 min-w-0 [overflow-wrap:anywhere]',
    files: 'flex flex-col min-w-0',
    file: 'text-foreground border border-border rounded-lg bg-background flex min-w-0 items-center relative',
    filePreview:
      'text-muted-foreground border border-border rounded-md bg-muted flex shrink-0 items-center justify-center relative overflow-hidden',
    fileMeta: 'flex flex-1 flex-col gap-0.5 min-w-0',
    fileName: 'text-foreground font-medium truncate',
    fileSize: 'text-xs text-muted-foreground truncate',
    fileRemove: `text-muted-foreground border border-transparent rounded-md inline-flex shrink-0 transition-colors items-center justify-center hover:(text-accent-foreground bg-accent-hover) ${FOCUS_VISIBLE_CLASS} active:bg-accent-active disabled:(opacity-64 pointer-events-none)`,
  },
  defaultVariants: {
    size: 'md',
    variant: 'area',
  },
  variants: {
    variant: {
      area: {
        control: 'text-center rounded-lg border-dashed w-full shadow-none self-stretch',
        wrapper: 'text-center flex flex-col justify-center',
      },
      button: {
        control: 'text-left rounded-md shadow-input self-start',
        wrapper: 'gap-x-2 grid grid-cols-[auto_minmax(0,1fr)]',
      },
    },
    size: {
      sm: {
        root: 'gap-2',
        control: 'text-xs px-3 py-2',
        wrapper: 'gap-y-0.5',
        icon: 'text-base',
        label: 'text-xs',
        description: 'text-xs',
        files: 'gap-2',
        file: 'p-2 gap-2',
        filePreview: 'size-8',
        fileName: 'text-xs',
        fileRemove: 'text-sm size-7',
      },
      md: {
        root: 'gap-3',
        control: 'text-sm px-3 py-2',
        wrapper: 'gap-y-0.5',
        icon: 'text-xl',
        label: 'text-sm',
        description: 'text-xs',
        files: 'gap-2',
        file: 'p-3 gap-3',
        filePreview: 'size-10',
        fileName: 'text-sm',
        fileRemove: 'text-base size-8',
      },
      lg: {
        root: 'gap-3',
        control: 'text-base px-4 py-2.5',
        wrapper: 'gap-x-3 gap-y-1',
        icon: 'text-2xl',
        label: 'text-base',
        description: 'text-sm',
        files: 'gap-3',
        file: 'p-3 gap-3',
        filePreview: 'size-12',
        fileName: 'text-base',
        fileRemove: 'text-lg size-9',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'area', size: 'sm' },
      control: 'px-4 py-5 min-h-32',
      wrapper: 'gap-1',
    },
    {
      variants: { variant: 'area', size: 'md' },
      control: 'px-6 py-6 min-h-40',
      wrapper: 'gap-2',
    },
    {
      variants: { variant: 'area', size: 'lg' },
      control: 'px-8 py-8 min-h-48',
      wrapper: 'gap-2',
    },
  ],
})
