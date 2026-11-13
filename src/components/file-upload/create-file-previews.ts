import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

import { createObjectUrl, revokeObjectUrl } from './file-input-sync'
import { isImageFile } from './file-validation'

export function createFilePreviews(options: {
  files: Accessor<File[]>
  enabled: Accessor<boolean>
}): Accessor<Map<File, string>> {
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())

  createEffect(
    on([options.files, options.enabled], ([files, previewsEnabled]) => {
      setPreviewUrls((previous) => {
        const next = new Map(previous)

        for (const [file, url] of previous.entries()) {
          if (!previewsEnabled || !files.includes(file) || !isImageFile(file)) {
            revokeObjectUrl(url)
            next.delete(file)
          }
        }

        if (!previewsEnabled) {
          return next
        }

        for (const file of files) {
          if (!isImageFile(file) || next.has(file)) {
            continue
          }

          const url = createObjectUrl(file)
          if (url) {
            next.set(file, url)
          }
        }

        return next
      })
    }),
  )

  onCleanup(() => {
    for (const url of previewUrls().values()) {
      revokeObjectUrl(url)
    }
  })

  return previewUrls
}
