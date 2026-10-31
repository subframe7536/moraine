import { Button, Toast } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ToastPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'tone',
          label: 'Tone',
          defaultValue: 'success',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Success', value: 'success' },
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
            { label: 'Loading', value: 'loading' },
          ],
        },
        { kind: 'switch', prop: 'large', label: 'Large', defaultValue: false },
        { kind: 'switch', prop: 'action', label: 'Action button', defaultValue: true },
        { kind: 'switch', prop: 'cancel', label: 'Cancel button', defaultValue: false },
        { kind: 'switch', prop: 'closable', label: 'Close button', defaultValue: true },
        { kind: 'switch', prop: 'progress', label: 'Progress bar', defaultValue: false },
        {
          kind: 'switch',
          prop: 'preventDuplicate',
          label: 'Prevent duplicate',
          defaultValue: false,
        },
      ]}
    >
      {(props) => {
        const showToast = () => {
          const options = {
            title: 'Preferences updated',
            description: 'Your account settings were saved.',
            large: props.large,
            closable: props.closable,
            progress: props.progress,
            preventDuplicate: props.preventDuplicate,
            cancel: props.cancel ? true : undefined,
            action: props.action
              ? {
                  label: 'Undo',
                  onClick: () => {},
                }
              : undefined,
          }

          switch (props.tone) {
            case 'default':
              Toast.show(options)
              break
            case 'info':
              Toast.info(options)
              break
            case 'warning':
              Toast.warning(options)
              break
            case 'error':
              Toast.error(options)
              break
            case 'loading':
              Toast.loading(options)
              break
            default:
              Toast.success(options)
          }
        }

        return (
          <div class="flex items-center justify-center">
            <Toast closable />
            <Button onClick={showToast} variant="outline" leading="i-lucide:bell">
              Trigger notification
            </Button>
          </div>
        )
      }}
    </DocsPlayground>
  )
}
