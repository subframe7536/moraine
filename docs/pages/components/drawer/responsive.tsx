import { Button, Dialog, Drawer, Field, Input } from '@src'
import { createMediaQuery } from '@src/utils'
import { Show } from 'solid-js'

function ProfileFields() {
  return (
    <div class="gap-4 grid">
      <Field label="Name">
        <Input defaultValue="Sarah Connor" />
      </Field>
      <Field label="Username">
        <Input defaultValue="@sconnor" />
      </Field>
    </div>
  )
}

export function Responsive() {
  const isDesktop = createMediaQuery('(min-width: 768px)')

  return (
    <Show
      when={isDesktop()}
      fallback={
        <Drawer>
          <Drawer.Trigger as={Button} variant="outline">
            Edit Profile
          </Drawer.Trigger>
          <Drawer.Content
            title="Edit profile"
            description="Make changes to your profile here. Click save when you're done."
          >
            <Drawer.Body>
              <ProfileFields />
            </Drawer.Body>
            <Drawer.Footer>
              <Drawer.Close as={Button}>Save changes</Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      }
    >
      <Dialog>
        <Dialog.Trigger as={Button} variant="outline">
          Edit Profile
        </Dialog.Trigger>
        <Dialog.Content
          title="Edit profile"
          description="Make changes to your profile here. Click save when you're done."
        >
          <Dialog.Body>
            <ProfileFields />
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close as={Button}>Save changes</Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </Show>
  )
}
