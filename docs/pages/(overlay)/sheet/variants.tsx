import { Button, Sheet } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet
        inset
        title="Inset sheet"
        close={<span class="text-xs font-semibold">Done</span>}
        body="Inset sheet with custom close content."
      >
        {(props) => (
          <Button {...props} variant="secondary">
            Inset + custom close
          </Button>
        )}
      </Sheet>

      <Sheet title="No close button" close={false} body="Close button is hidden for this sheet.">
        {(props) => (
          <Button {...props} variant="outline">
            Close=false
          </Button>
        )}
      </Sheet>
    </div>
  )
}
