import { Button, CommandPalette, Dialog, Icon } from '@src'
import { createSignal } from 'solid-js'

export function CustomEmptyState() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-full w-lg">
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        close={false}
        classes={{ body: 'p-0 mb-0' }}
        body={
          <CommandPalette
            groups={[]}
            emptyRender={() => (
              <span class="flex flex-col gap-2 items-center">
                <Icon name="i-lucide-search-x" class="text-muted-foreground size-6" />
                <span class="text-foreground font-medium">No commands found</span>
                <span class="text-xs">Try a different keyword or clear the search.</span>
              </span>
            )}
          />
        }
      >
        <Button variant="outline">Open palette</Button>
      </Dialog>
    </div>
  )
}
