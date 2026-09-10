import { Button, Dialog, Input, Textarea } from '@src'

export function Basic() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog>
        <Dialog.Trigger as={Button} variant="outline" leading="i-lucide:user-pen">
          Edit Profile
        </Dialog.Trigger>
        <Dialog.Content
          title="Edit Profile"
          description="Make changes to your public profile and workspace handle."
          body={
            <div class="py-2 space-y-4">
              <div class="space-y-1.5">
                <label class="text-sm font-medium">Full Name</label>
                <Input defaultValue="Alex Morgan" />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm font-medium">Public Handle</label>
                <Input defaultValue="alex.morgan" leading="@" />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm font-medium">Bio</label>
                <Textarea
                  rows={3}
                  defaultValue="Product engineer building modern web applications with SolidJS."
                />
              </div>
            </div>
          }
          footer={
            <div class="flex gap-2 w-full justify-end">
              <Button variant="outline">Cancel</Button>
              <Button variant="default">Save Profile</Button>
            </div>
          }
        />
      </Dialog>
    </div>
  )
}
