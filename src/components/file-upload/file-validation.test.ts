import { describe, expect, test } from 'vitest'

import { constrainFileCount, filterAcceptedFiles, formatFileSize } from './file-validation'

function createFile(
  name: string,
  {
    size = 1,
    type = '',
    lastModified = 1,
  }: { size?: number; type?: string; lastModified?: number } = {},
): File {
  return new File(['x'.repeat(size)], name, { type, lastModified })
}

function filter(
  files: File[],
  options: Partial<{
    accept: string
    existingFiles: File[]
    minSize: number
    maxSize: number
  }> = {},
) {
  return filterAcceptedFiles(files, {
    accept: undefined,
    existingFiles: [],
    minSize: undefined,
    maxSize: undefined,
    ...options,
  })
}

describe('filterAcceptedFiles accept matching', () => {
  test('accepts every file when accept is unset, empty, or "*"', () => {
    const file = createFile('notes.txt', { type: 'text/plain' })

    for (const accept of [undefined, '', '*']) {
      expect(filter([file], { accept }).accepted).toEqual([file])
    }
  })

  test('matches extensions case-insensitively', () => {
    const file = createFile('photo.PNG', { type: 'image/png' })

    expect(filter([file], { accept: '.png' }).accepted).toEqual([file])
    expect(filter([file], { accept: '.jpg' }).rejected).toEqual([
      { file, errors: ['FILE_INVALID_TYPE'] },
    ])
  })

  test('matches mime wildcards by base type', () => {
    const image = createFile('a.webp', { type: 'image/webp' })
    const text = createFile('a.txt', { type: 'text/plain' })

    const result = filter([image, text], { accept: 'image/*' })

    expect(result.accepted).toEqual([image])
    expect(result.rejected).toEqual([{ file: text, errors: ['FILE_INVALID_TYPE'] }])
  })

  test('matches exact mime types', () => {
    const pdf = createFile('a.pdf', { type: 'application/pdf' })
    const json = createFile('a.json', { type: 'application/json' })

    expect(filter([pdf, json], { accept: 'application/pdf' }).accepted).toEqual([pdf])
  })

  test('accepts a file matching any entry in a comma list with whitespace', () => {
    const png = createFile('a.png', { type: 'image/png' })
    const pdf = createFile('b.pdf', { type: 'application/pdf' })
    const zip = createFile('c.zip', { type: 'application/zip' })

    const result = filter([png, pdf, zip], { accept: ' .PNG , application/pdf ' })

    expect(result.accepted).toEqual([png, pdf])
    expect(result.rejected).toEqual([{ file: zip, errors: ['FILE_INVALID_TYPE'] }])
  })
})

describe('filterAcceptedFiles size and error rules', () => {
  test('rejects files smaller than minSize', () => {
    const file = createFile('tiny.txt', { size: 4 })

    expect(filter([file], { minSize: 10 }).rejected).toEqual([{ file, errors: ['FILE_TOO_SMALL'] }])
  })

  test('rejects files larger than maxSize', () => {
    const file = createFile('big.txt', { size: 20 })

    expect(filter([file], { maxSize: 10 }).rejected).toEqual([{ file, errors: ['FILE_TOO_LARGE'] }])
  })

  test('reports only the min size error when a file violates both bounds', () => {
    const file = createFile('odd.txt', { size: 50 })

    expect(filter([file], { minSize: 100, maxSize: 10 }).rejected).toEqual([
      { file, errors: ['FILE_TOO_SMALL'] },
    ])
  })

  test('reports both type and size errors on one file', () => {
    const file = createFile('huge.exe', { size: 50, type: 'application/x-msdownload' })

    expect(filter([file], { accept: 'image/*', maxSize: 10 }).rejected).toEqual([
      { file, errors: ['FILE_INVALID_TYPE', 'FILE_TOO_LARGE'] },
    ])
  })
})

describe('filterAcceptedFiles duplicates', () => {
  test('rejects a file identical to an existing file', () => {
    const existing = createFile('a.txt', { size: 3, type: 'text/plain', lastModified: 5 })
    const incoming = createFile('a.txt', { size: 3, type: 'text/plain', lastModified: 5 })

    expect(filter([incoming], { existingFiles: [existing] }).rejected).toEqual([
      { file: incoming, errors: ['FILE_DUPLICATE'] },
    ])
  })

  test('rejects repeats within the same batch, keeping the first', () => {
    const first = createFile('a.txt', { size: 3, type: 'text/plain' })
    const repeat = createFile('a.txt', { size: 3, type: 'text/plain' })

    const result = filter([first, repeat])

    expect(result.accepted).toEqual([first])
    expect(result.rejected).toEqual([{ file: repeat, errors: ['FILE_DUPLICATE'] }])
  })

  test('treats files differing in lastModified as distinct', () => {
    const existing = createFile('a.txt', { lastModified: 1 })
    const incoming = createFile('a.txt', { lastModified: 2 })

    expect(filter([incoming], { existingFiles: [existing] }).accepted).toEqual([incoming])
  })
})

describe('constrainFileCount', () => {
  test('accepts everything when maxFiles is unlimited', () => {
    const files = [createFile('a'), createFile('b'), createFile('c')]

    expect(constrainFileCount(files, 100, Number.POSITIVE_INFINITY)).toEqual({
      accepted: files,
      rejected: [],
    })
  })

  test('keeps files that fit and rejects the overflow in order', () => {
    const [a, b, c, d] = [createFile('a'), createFile('b'), createFile('c'), createFile('d')]

    expect(constrainFileCount([a, b, c, d], 1, 3)).toEqual({
      accepted: [a, b],
      rejected: [
        { file: c, errors: ['TOO_MANY_FILES'] },
        { file: d, errors: ['TOO_MANY_FILES'] },
      ],
    })
  })

  test('rejects every file when the limit is already reached', () => {
    const file = createFile('a')

    expect(constrainFileCount([file], 2, 2)).toEqual({
      accepted: [],
      rejected: [{ file, errors: ['TOO_MANY_FILES'] }],
    })
  })

  test('rejects every file when maxFiles is 0', () => {
    const file = createFile('a')

    expect(constrainFileCount([file], 0, 0)).toEqual({
      accepted: [],
      rejected: [{ file, errors: ['TOO_MANY_FILES'] }],
    })
  })
})

describe('formatFileSize', () => {
  test('formats zero and byte values without decimals', () => {
    expect(formatFileSize(0)).toBe('0B')
    expect(formatFileSize(512)).toBe('512B')
  })

  test('formats kilobyte values with one decimal', () => {
    expect(formatFileSize(1024)).toBe('1.0KB')
    expect(formatFileSize(1536)).toBe('1.5KB')
  })

  test('formats megabyte values', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0MB')
  })
})
