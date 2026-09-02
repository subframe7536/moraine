import { renderToString } from 'solid-js/web'

import { FileUpload } from './file-upload'

export function renderFileUploadFixture(): string {
  return renderToString(() => (
    <FileUpload dropzone preview={false} label="Upload files" description="Description" />
  ))
}
