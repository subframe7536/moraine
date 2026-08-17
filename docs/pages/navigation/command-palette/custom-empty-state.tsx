import { CommandPalette, Icon } from '@src'

export function CustomEmptyState() {
  return (
    <div class="max-w-full w-lg">
      <CommandPalette
        groups={[]}
        autofocus={false}
        emptyRender={() => (
          <span class="flex flex-col gap-2 items-center">
            <Icon name="i-lucide-search-x" class="text-muted-foreground size-6" />
            <span class="text-foreground font-medium">No commands found</span>
            <span class="text-xs">Try a different keyword or clear the search.</span>
          </span>
        )}
      />
    </div>
  )
}
