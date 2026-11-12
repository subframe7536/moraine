import type { FileUploadT } from './file-upload.types'

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function isAcceptedFileType(file: File, accept?: string): boolean {
  if (!accept || accept === '*') {
    return true
  }

  const rules = accept
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (rules.length === 0) {
    return true
  }

  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()
  const baseType = fileType.split('/')[0] ?? ''

  return rules.some((rule) => {
    if (rule === '*') {
      return true
    }

    if (rule.startsWith('.')) {
      return fileName.endsWith(rule)
    }

    if (rule.endsWith('/*')) {
      return baseType === rule.split('/')[0]
    }

    return fileType === rule
  })
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

export function isFileDragEvent(event: DragEvent): boolean {
  if (!event.dataTransfer) {
    return Boolean(event.target && 'files' in event.target)
  }

  return Array.from(event.dataTransfer.types).some(
    (type) => type === 'Files' || type === 'application/x-moz-file',
  )
}

export function createFileList(files: File[]): FileList | undefined {
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

export function syncNativeInputFiles(input: HTMLInputElement | undefined, files: File[]): boolean {
  if (!input) {
    return false
  }

  const fileList = createFileList(files)
  if (fileList) {
    try {
      input.files = fileList
      const assignedFiles = Array.from(input.files ?? [])

      return (
        assignedFiles.length === files.length &&
        assignedFiles.every((file, index) => file === files[index])
      )
    } catch {
      // Some browsers reject FileList assignment; preserve the component state and leave the native input unchanged.
    }
  }

  if (files.length === 0) {
    input.value = ''
    return true
  }

  return false
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0B'
  }

  const unit = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const power = Math.floor(Math.log(bytes) / Math.log(unit))
  const value = bytes / unit ** power
  const precision = power === 0 ? 0 : 1

  return `${value.toFixed(precision)}${units[power]}`
}

export function createRejection(file: File, error: FileUploadT.Error): FileUploadT.Rejection {
  return {
    file,
    errors: [error],
  }
}

export function getFileIdentity(file: File): string {
  return [file.name, file.size, file.type, file.lastModified].join('\0')
}

export function filterAcceptedFiles(
  files: File[],
  options: {
    accept: string | undefined
    existingFiles: File[]
    minSize: number | undefined
    maxSize: number | undefined
  },
): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  const accepted: File[] = []
  const rejected: FileUploadT.Rejection[] = []
  const seenFiles = new Set(options.existingFiles.map(getFileIdentity))

  for (const file of files) {
    const errors: FileUploadT.Error[] = []

    if (!isAcceptedFileType(file, options.accept)) {
      errors.push('FILE_INVALID_TYPE')
    }

    if (options.minSize !== undefined && file.size < options.minSize) {
      errors.push('FILE_TOO_SMALL')
    } else if (options.maxSize !== undefined && file.size > options.maxSize) {
      errors.push('FILE_TOO_LARGE')
    }

    if (errors.length > 0) {
      rejected.push({ file, errors })
      continue
    }

    const fileIdentity = getFileIdentity(file)
    if (seenFiles.has(fileIdentity)) {
      rejected.push(createRejection(file, 'FILE_DUPLICATE'))
      continue
    }

    seenFiles.add(fileIdentity)
    accepted.push(file)
  }

  return { accepted, rejected }
}

export function constrainMultipleFiles(
  accepted: File[],
  currentCount: number,
  maxFiles: number,
): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  const rejected: FileUploadT.Rejection[] = []
  const remainingSlots = Number.isFinite(maxFiles)
    ? Math.max(0, maxFiles - currentCount)
    : Number.POSITIVE_INFINITY

  if (remainingSlots === 0) {
    for (const file of accepted) {
      rejected.push(createRejection(file, 'TOO_MANY_FILES'))
    }

    return { accepted: [], rejected }
  }

  if (!Number.isFinite(remainingSlots) || accepted.length <= remainingSlots) {
    return { accepted, rejected }
  }

  const boundedAccepted = accepted.slice(0, remainingSlots)
  const overflow = accepted.slice(remainingSlots)

  for (const file of overflow) {
    rejected.push(createRejection(file, 'TOO_MANY_FILES'))
  }

  return { accepted: boundedAccepted, rejected }
}

export function constrainSingleFile(accepted: File[]): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  if (accepted.length <= 1) {
    return { accepted, rejected: [] }
  }

  const rejected = accepted.slice(1).map((file) => createRejection(file, 'TOO_MANY_FILES'))

  return { accepted: [accepted[0]!], rejected }
}
