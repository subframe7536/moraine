import { Button, CommandPalette } from '@src'
import { createSignal } from 'solid-js'

export function CustomEmptyState() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-full w-lg">
      <CommandPalette
        open={open()}
        onOpenChange={setOpen}
        groups={[]}
        emptyRender={() => (
          <span class="flex flex-col gap-2 items-center">
            <span class="i-lucide-search-x text-muted-foreground size-6" aria-hidden="true" />
            <span class="text-foreground font-medium">No commands found</span>
            <span class="text-xs">Try a different keyword or clear the search.</span>
          </span>
        )}
      >
        <Button variant="outline">Open palette</Button>
      </CommandPalette>
    </div>
  )
}
