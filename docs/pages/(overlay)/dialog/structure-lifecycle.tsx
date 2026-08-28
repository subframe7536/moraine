import { Button, Dialog } from '@src'

export function StructureLifecycle() {
  return (
    <Dialog
      title="Create Workspace"
      description="Enter workspace configuration parameters."
      body={
        <div class="text-sm text-muted-foreground py-2">
          Workspaces allow collaboration across team members with role-based permissions.
        </div>
      }
      footer={
        <div class="flex gap-2 w-full justify-end">
          <Button variant="ghost">Cancel</Button>
          <Button>Save Workspace</Button>
        </div>
      }
    >
      {(props) => <Button {...props}>Create Workspace</Button>}
    </Dialog>
  )
}
