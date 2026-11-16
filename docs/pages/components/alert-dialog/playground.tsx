import { AlertDialog, Button } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function AlertDialogPlayground() {
  return (
    <>
      <AlertDialog />
      <DocsPlayground
        controls={[
          { kind: 'input', prop: 'title', label: 'Title', defaultValue: 'Delete this project?' },
          {
            kind: 'input',
            prop: 'description',
            label: 'Description',
            defaultValue: 'This action cannot be undone.',
          },
          {
            kind: 'select',
            prop: 'type',
            label: 'Type',
            defaultValue: 'info',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Info', value: 'info' },
              { label: 'Success', value: 'success' },
              { label: 'Warning', value: 'warning' },
              { label: 'Error', value: 'error' },
            ],
          },
          { kind: 'switch', prop: 'center', label: 'Center', defaultValue: false },
          { kind: 'switch', prop: 'subtle', label: 'Subtle', defaultValue: false },
        ]}
      >
        {(props) => (
          <Button
            variant="solid"
            onClick={() =>
              void AlertDialog.confirm({
                type: props.type,
                title: props.title,
                description: props.description,
                center: props.center,
                subtle: props.subtle,
              })
            }
          >
            Open alert
          </Button>
        )}
      </DocsPlayground>
    </>
  )
}
