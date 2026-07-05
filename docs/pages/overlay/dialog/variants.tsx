import { Button, Dialog } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        title="No close button"
        close={false}
        body="This dialog has no top-right close button."
      >
        <Button variant="outline">Close=false</Button>
      </Dialog>

      <Dialog
        title="Custom close"
        closeIcon={<span class="text-xs font-semibold size-full">Done</span>}
        body="Custom close content rendered in the close button."
      >
        <Button variant="outline">Custom close</Button>
      </Dialog>
    </div>
  )
}
