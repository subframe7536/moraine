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
          { kind: 'switch', prop: 'danger', label: 'Danger', defaultValue: true },
          { kind: 'switch', prop: 'center', label: 'Center', defaultValue: false },
          { kind: 'switch', prop: 'subtle', label: 'Subtle', defaultValue: false },
        ]}
      >
        {(props) => (
          <Button
            variant="solid"
            tone={props.danger ? 'danger' : 'primary'}
            onClick={() =>
              void AlertDialog.confirm({
                title: props.title,
                description: props.description,
                danger: props.danger,
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
