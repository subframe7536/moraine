import { CommandPalette } from '@src'

export function CustomEmptyState() {
  return (
    <div class="max-w-full w-lg">
      <CommandPalette
        items={[]}
        empty={
          <span class="flex flex-col gap-2 items-center">
            <span class="i-lucide-search-x text-muted-foreground size-6" aria-hidden="true" />
            <span class="text-foreground font-medium">No commands found</span>
            <span class="text-xs">Try a different keyword or clear the search.</span>
          </span>
        }
      />
    </div>
  )
}
