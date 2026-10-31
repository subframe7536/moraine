import { Empty, Icon } from '@src'

export function Basic() {
  return (
    <Empty>
      <Empty.Media>
        <Icon name="i-lucide-folder-open" class="text-muted-foreground size-8" />
      </Empty.Media>
      <Empty.Title>No projects yet</Empty.Title>
      <Empty.Description>Create a project to organize your work.</Empty.Description>
    </Empty>
  )
}
