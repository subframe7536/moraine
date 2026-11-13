function createFileList(files: File[]): FileList | undefined {
  if (typeof DataTransfer === 'undefined') {
    return undefined
  }

  try {
    const transfer = new DataTransfer()

    for (const file of files) {
      transfer.items.add(file)
    }

    return transfer.files
  } catch {
    return undefined
  }
}

export function syncNativeInputFiles(input: HTMLInputElement | undefined, files: File[]): void {
  if (!input) {
    return
  }

  const fileList = createFileList(files)
  if (fileList) {
    try {
      input.files = fileList
      return
    } catch {
      // Some browsers reject FileList assignment; preserve the component state and leave the native input unchanged.
    }
  }

  if (files.length === 0) {
    input.value = ''
  }
}

export function isFileDragEvent(event: DragEvent): boolean {
  if (!event.dataTransfer) {
    return Boolean(event.target && 'files' in event.target)
  }

  return Array.from(event.dataTransfer.types).some(
    (type) => type === 'Files' || type === 'application/x-moz-file',
  )
}

export function createObjectUrl(file: File): string | undefined {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return undefined
  }

  return URL.createObjectURL(file)
}

export function revokeObjectUrl(url: string): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return
  }

  URL.revokeObjectURL(url)
}
