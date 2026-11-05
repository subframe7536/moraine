import { Button, Drawer, Field, Input } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function DrawerPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'side',
          label: 'Side',
          defaultValue: 'bottom',
          options: [
            { label: 'Bottom', value: 'bottom' },
            { label: 'Top', value: 'top' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        { kind: 'switch', prop: 'handle', label: 'Handle', defaultValue: true },
        { kind: 'switch', prop: 'closable', label: 'Closable', defaultValue: false },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => (
        <Drawer
          side={props.side}
          handle={props.handle}
          closable={props.closable}
          overlay={props.overlay}
        >
          <Drawer.Trigger as={Button} variant="outline">
            Open Drawer
          </Drawer.Trigger>
          <Drawer.Content
            title="Edit User Profile"
            description="Make changes to your account profile here."
          >
            <Drawer.Body>
              <div class="py-3 space-y-4">
                <Field label="Display name">
                  <Input defaultValue="Sarah Connor" />
                </Field>
                <Field label="Username">
                  <Input defaultValue="@sconnor" />
                </Field>
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              <div class="flex gap-2 w-full justify-end">
                <Drawer.Close as={Button} variant="ghost" size="sm">
                  Cancel
                </Drawer.Close>
                <Drawer.Close as={Button} size="sm">
                  Save changes
                </Drawer.Close>
              </div>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      )}
    </DocsPlayground>
  )
}
