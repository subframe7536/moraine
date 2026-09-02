import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { FileUpload } from './file-upload'

describe('FileUpload SSR Hydration', () => {
  test('hydrates the empty dropzone and preserves root identity across branch changes', () => {
    const [dropzone, setDropzone] = createSignal(true)

    const { container } = hydrateFixture(
      '/src/forms/file-upload/file-upload.ssr.fixture.tsx',
      'renderFileUploadFixture',
      () => (
        <FileUpload
          dropzone={dropzone()}
          preview={false}
          label="Upload files"
          description="Description"
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')
    expect(root).not.toBeNull()
    expect(container.querySelector('[data-slot="control"]')?.tagName).toBe('DIV')
    expect(container.querySelector('[data-slot="files"]')).toBeNull()

    setDropzone(false)
    expect(container.querySelector('[data-slot="control"]')?.tagName).toBe('BUTTON')
    expect(container.querySelector('[data-slot="root"]')).toBe(root)
  })
})
