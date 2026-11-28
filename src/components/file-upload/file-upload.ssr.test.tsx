import { createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { FileUpload } from './file-upload'
describe('fileUpload SSR Hydration', () => {
  it('hydrates the empty dropzone and preserves root identity across branch changes', () => {
    const [dropzone, setDropzone] = createSignal(true)

    const { container } = hydrateFixture(
      '/src/components/file-upload/file-upload.ssr.fixture.tsx',
      'renderFileUploadFixture',
      () => (
        <FileUpload
          dropzone={dropzone()}
          fileList={false}
          label="Upload files"
          description="Description"
        />
      ),
    )

    const root = container.querySelector('[data-slot="file-upload"]')
    expect(root).not.toBeNull()
    expect(container.querySelector('[data-slot="file-upload-control"]')?.tagName).toBe('BUTTON')
    expect(container.querySelector('[data-slot="file-upload-files"]')).toBeNull()

    flush(() => setDropzone(false))
    expect(container.querySelector('[data-slot="file-upload-control"]')?.tagName).toBe('BUTTON')
    expect(container.querySelector('[data-slot="file-upload"]')).toBe(root)
  })
})
