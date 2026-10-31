import { Empty, Icon } from '@src'

export function Basic() {
  return (
    <Empty>
      <Empty.Media>
        <span class="text-3xl text-muted-foreground">
          <Icon name="i-lucide-folder-open" />
        </span>
      </Empty.Media>
      <Empty.Title>No projects yet</Empty.Title>
      <Empty.Description>Create a project to organize your work.</Empty.Description>
    </Empty>
  )
}
