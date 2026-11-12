import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

import { createObjectUrl, isImageFile, revokeObjectUrl } from './file-upload-utils'

export function useFilePreviews(options: {
  files: Accessor<File[]>
  preview: Accessor<boolean>
}): Accessor<Map<File, string>> {
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())

  createEffect(
    on([options.files, options.preview], ([files, previewsEnabled]) => {
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
