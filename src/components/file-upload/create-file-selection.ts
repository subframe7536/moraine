import type { Accessor } from 'solid-js'
import { createEffect, createMemo, on } from 'solid-js'

import { syncNativeInputFiles } from './file-input-sync'
import type { FileUploadT } from './file-upload.types'
import { constrainFileCount, filterAcceptedFiles } from './file-validation'

export interface CreateFileSelectionOptions {
  value: Accessor<File | File[] | null>
  multiple: Accessor<boolean>
  accept: Accessor<string | undefined>
  maxFiles: Accessor<number | undefined>
  minSize: Accessor<number | undefined>
  maxSize: Accessor<number | undefined>
  disabled: Accessor<boolean>
  readOnly: Accessor<boolean>
  input: Accessor<HTMLInputElement | undefined>
  commit: (value: File | File[] | null) => void
  onReject: (rejected: FileUploadT.Rejection[]) => void
}

export function createFileSelection(options: CreateFileSelectionOptions): {
  selectedFiles: Accessor<File[]>
  interactive: Accessor<boolean>
  addFiles: (files: File[]) => void
  removeFileAt: (index: number) => void
} {
  const selectedFiles = createMemo<File[]>(() => {
    const value = options.value()
    if (Array.isArray(value)) {
      return value
    }
    return value ? [value] : []
  })

  const interactive = () => !options.disabled() && !options.readOnly()

  createEffect(
    on([options.input, selectedFiles], ([input, files]) => {
      syncNativeInputFiles(input, files)
    }),
  )

  function commit(files: File[]): void {
    options.commit(options.multiple() ? [...files] : (files[0] ?? null))
  }

  function addFiles(files: File[]): void {
    if (files.length === 0) {
      return
    }

    const currentFiles = selectedFiles()

    if (!interactive()) {
      syncNativeInputFiles(options.input(), currentFiles)
      return
    }

    const { accepted, rejected } = filterAcceptedFiles(files, {
      accept: options.accept(),
      existingFiles: currentFiles,
      minSize: options.minSize(),
      maxSize: options.maxSize(),
    })

    const multiple = options.multiple()
    const limit = options.maxFiles() ?? Number.POSITIVE_INFINITY
    const baseFiles = multiple ? currentFiles : []
    const bounded = constrainFileCount(
      accepted,
      baseFiles.length,
      multiple ? limit : Math.min(limit, 1),
    )
    rejected.push(...bounded.rejected)

    if (bounded.accepted.length > 0) {
      commit([...baseFiles, ...bounded.accepted])
    } else {
      syncNativeInputFiles(options.input(), currentFiles)
    }

    if (rejected.length > 0) {
      options.onReject(rejected)
    }
  }

  function removeFileAt(index: number): void {
    if (!interactive()) {
      return
    }

    const currentFiles = selectedFiles()
    if (!currentFiles[index]) {
      return
    }

    commit(currentFiles.filter((_, fileIndex) => fileIndex !== index))
  }

  return { selectedFiles, interactive, addFiles, removeFileAt }
}
