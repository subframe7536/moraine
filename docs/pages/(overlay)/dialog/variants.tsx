import { Button, Dialog } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        title="Unsaved Changes"
        close={false}
        description="You have unsaved changes in your document."
        body="Leaving this page without saving will cause all recent modifications to be permanently lost."
        footer={
          <div class="flex gap-2 w-full justify-end">
            <Button variant="ghost">Discard</Button>
            <Button variant="default">Save & Continue</Button>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide:alert-circle">
            Unsaved Changes (No close X)
          </Button>
        )}
      </Dialog>

      <Dialog
        title="Terms of Service Updated"
        closeIcon={<span class="text-xs font-semibold px-1">Done</span>}
        body="We updated our terms and privacy policy effective October 2026. Please review our compliance documentation."
        footer={
          <div class="flex w-full justify-end">
            <Button variant="default">Acknowledge</Button>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide:file-text">
            Policy Notice (Custom Close)
          </Button>
        )}
      </Dialog>
    </div>
  )
}
