import { Button, Dialog } from '@src'

export function DefaultShell() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        title="Delete Project"
        description="This action cannot be undone."
        body={
          <p class="text-sm text-foreground">
            The selected project and all related records will be permanently removed.
          </p>
        }
        footer={
          <>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      >
        <Button>Open dialog</Button>
      </Dialog>
    </div>
  )
}
