import { Button, Dialog, FormField, Input, Textarea } from '@src'

export function DefaultShell() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        title="Edit Profile"
        description="Make changes to your public profile and workspace handle."
        body={
          <div class="py-2 space-y-4">
            <FormField label="Full Name">
              <Input defaultValue="Alex Morgan" />
            </FormField>
            <FormField label="Public Handle">
              <Input defaultValue="alex.morgan" leading="@" />
            </FormField>
            <FormField label="Bio">
              <Textarea
                rows={3}
                defaultValue="Product engineer building modern web applications with SolidJS."
              />
            </FormField>
          </div>
        }
        footer={
          <div class="flex gap-2 w-full justify-end">
            <Button variant="outline">Cancel</Button>
            <Button variant="default">Save Profile</Button>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide:user-pen">
            Edit Profile
          </Button>
        )}
      </Dialog>
    </div>
  )
}
