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
          {
            kind: 'select',
            prop: 'align',
            label: 'Align',
            defaultValue: 'start',
            options: [
              { label: 'Start', value: 'start' },
              { label: 'Center', value: 'center' },
            ],
          },
          {
            kind: 'select',
            prop: 'variant',
            label: 'Variant',
            defaultValue: 'default',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Subtle', value: 'subtle' },
            ],
          },
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
                align: props.align,
                variant: props.variant,
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
