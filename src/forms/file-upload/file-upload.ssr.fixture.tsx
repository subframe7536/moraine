import { renderToString } from 'solid-js/web'

import { FileUpload } from './file-upload.tsx'

export function renderFileUploadFixture(): string {
  return renderToString(() => (
    <FileUpload dropzone preview={false} label="Upload files" description="Description" />
  ))
}
