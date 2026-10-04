import { Button, Empty, Icon, Input } from '@src'
import { createSignal } from 'solid-js'

export function NoResults() {
  const [search, setSearch] = createSignal('design systems')
  return (
    <div class="max-w-md w-full">
      <Input
        value={search()}
        onInput={(event) => setSearch(event.currentTarget.value)}
        aria-label="Search projects"
        placeholder="Search projects"
      />
      <Empty size="sm">
        <Empty.Media>
          <Icon name="i-lucide-search" class="text-muted-foreground size-6" />
        </Empty.Media>
        <Empty.Title>No matching projects</Empty.Title>
        <Empty.Description>Try a different keyword or clear your search.</Empty.Description>
        <Empty.Actions>
          <Button variant="outline" size="sm" disabled={!search()} onClick={() => setSearch('')}>
            Clear search
          </Button>
        </Empty.Actions>
      </Empty>
    </div>
  )
}
