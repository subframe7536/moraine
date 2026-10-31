import { Button, Field, Input, Sheet } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function SheetPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'side',
          label: 'Side',
          defaultValue: 'right',
          options: [
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
          ],
        },
        {
          kind: 'switch',
          prop: 'closeOnOverlayClick',
          label: 'Close on overlay click',
          defaultValue: true,
        },
        { kind: 'switch', prop: 'closeOnEscape', label: 'Close on Escape', defaultValue: true },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => (
        <Sheet
          closeOnOverlayClick={props.closeOnOverlayClick}
          closeOnEscape={props.closeOnEscape}
          side={props.side}
          overlay={props.overlay}
        >
          <Sheet.Trigger as={Button} variant="outline">
            Open Sheet
          </Sheet.Trigger>
          <Sheet.Content
            title="Edit User Profile"
            description="Make changes to your account profile here."
          >
            <Sheet.Body>
              <div class="py-3 space-y-4">
                <Field label="Display name">
                  <Input defaultValue="Sarah Connor" />
                </Field>
                <Field label="Username">
                  <Input defaultValue="@sconnor" />
                </Field>
              </div>
            </Sheet.Body>
            <Sheet.Footer>
              <div class="flex gap-2 w-full justify-end">
                <Sheet.Close as={Button} variant="ghost" size="sm">
                  Cancel
                </Sheet.Close>
                <Sheet.Close as={Button} size="sm">
                  Save changes
                </Sheet.Close>
              </div>
            </Sheet.Footer>
          </Sheet.Content>
        </Sheet>
      )}
    </DocsPlayground>
  )
}
