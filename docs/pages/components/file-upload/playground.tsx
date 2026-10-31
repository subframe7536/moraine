import { FileUpload } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function FileUploadPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'dropzone', label: 'Dropzone', defaultValue: true },
      ]}
    >
      {(props) => (
        <FileUpload
          label="Upload documents"
          description="Click anywhere or drop PDF, PNG, or JPG up to 10MB"
          size={props.size}
          disabled={props.disabled}
          dropzone={props.dropzone}
        />
      )}
    </DocsPlayground>
  )
}
