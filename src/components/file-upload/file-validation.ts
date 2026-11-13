import type { FileUploadT } from './file-upload.types'

interface FileSelection {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
}

function createRejection(file: File, error: FileUploadT.Error): FileUploadT.Rejection {
  return { file, errors: [error] }
}

function isAcceptedFileType(file: File, accept?: string): boolean {
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

function getFileIdentity(file: File): string {
  return [file.name, file.size, file.type, file.lastModified].join('\0')
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function filterAcceptedFiles(
  files: File[],
  options: {
    accept: string | undefined
    existingFiles: File[]
    minSize: number | undefined
    maxSize: number | undefined
  },
): FileSelection {
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

export function constrainFileCount(
  accepted: File[],
  currentCount: number,
  maxFiles: number,
): FileSelection {
  const remainingSlots = Number.isFinite(maxFiles)
    ? Math.max(0, maxFiles - currentCount)
    : Number.POSITIVE_INFINITY

  if (accepted.length <= remainingSlots) {
    return { accepted, rejected: [] }
  }

  return {
    accepted: accepted.slice(0, remainingSlots),
    rejected: accepted.slice(remainingSlots).map((file) => createRejection(file, 'TOO_MANY_FILES')),
  }
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
