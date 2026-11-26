import { isServer } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createMemo, onCleanup, untrack } from 'solid-js'

import { createObjectUrl, revokeObjectUrl } from './file-input-sync'
import { isImageFile } from './file-validation'
export function createFilePreviews(options: {
  files: Accessor<Array<File>>
  enabled: Accessor<boolean>
}): Accessor<Map<File, string>> {
  const previewUrls = createMemo<Map<File, string>>((previous = new Map()) => {
    const files = options.files()
    const previewsEnabled = options.enabled()

    if (isServer) {
      return previous.size === 0 ? previous : new Map()
    }

    let changed = false
    const next = new Map(previous)

    for (const [file, url] of previous.entries()) {
      if (!previewsEnabled || !files.includes(file) || !isImageFile(file)) {
        revokeObjectUrl(url)
        next.delete(file)
        changed = true
      }
    }

    if (previewsEnabled) {
      for (const file of files) {
        if (!isImageFile(file) || next.has(file)) {
          continue
        }

        const url = createObjectUrl(file)
        if (url) {
          next.set(file, url)
          changed = true
        }
      }
    }

    return changed ? next : previous
  })

  onCleanup(() => {
    for (const url of untrack(previewUrls).values()) {
      revokeObjectUrl(url)
    }
  })

  return previewUrls
}
