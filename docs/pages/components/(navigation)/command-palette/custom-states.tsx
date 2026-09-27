import { CommandPalette } from '@src'

export function CustomStates() {
  return (
    <div class="b-(1 border) max-w-md w-full shadow-lg overflow-hidden rounded-xl">
      <CommandPalette
        autofocus={false}
        placeholder="Search empty query..."
        groups={[]}
        emptyRender={() => (
          <p class="text-muted-foreground p-6 text-center text-xs">
            No commands found matching your query.
          </p>
        )}
      />
    </div>
  )
}
