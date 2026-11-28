import { isServer } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createEffect, createSignal, onSettled } from 'solid-js'

import { createObjectUrl, revokeObjectUrl } from './file-input-sync'
import { isImageFile } from './file-validation'
export function createFilePreviews(options: {
  files: Accessor<Array<File>>
  enabled: Accessor<boolean>
}): Accessor<Map<File, string>> {
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())
  let activeUrls = new Map<File, string>()

  createEffect(
    () => [options.files(), options.enabled()] as const,
    ([files, previewsEnabled]) => {
      if (isServer) {
        return
      }

      let changed = false
      const next = new Map(activeUrls)

      for (const [file, url] of activeUrls.entries()) {
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

      if (changed) {
        activeUrls = next
        setPreviewUrls(next)
      }
    },
  )

  onSettled(() => () => {
    for (const url of activeUrls.values()) {
      revokeObjectUrl(url)
    }
    activeUrls.clear()
  })

  return previewUrls
}
