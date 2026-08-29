import { CommandPalette } from '@src'

export function CustomStates() {
  return (
    <div class="b-(1 border) rounded-xl max-w-md w-full shadow-lg overflow-hidden">
      <CommandPalette
        autofocus={false}
        placeholder="Search empty query..."
        groups={[]}
        emptyRender={() => (
          <p class="text-xs text-muted-foreground p-6 text-center">
            No commands found matching your query.
          </p>
        )}
      />
    </div>
  )
}
