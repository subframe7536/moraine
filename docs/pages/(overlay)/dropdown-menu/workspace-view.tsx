import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { createMemo, createSignal, For, Show } from 'solid-js'

const PROJECTS = [
  { name: 'Design system', owner: 'Alex', updated: 3, archived: false },
  { name: 'Customer portal', owner: 'Sam', updated: 2, archived: false },
  { name: 'Website v1', owner: 'Jordan', updated: 1, archived: true },
]

export function WorkspaceView() {
  const [showArchived, setShowArchived] = createSignal(false)
  const [showOwner, setShowOwner] = createSignal(true)
  const [sort, setSort] = createSignal('updated')
  const projects = createMemo(() => {
    const includeArchived = showArchived()
    const byName = sort() === 'name'
    return PROJECTS.filter((project) => includeArchived || !project.archived).sort((a, b) =>
      byName ? a.name.localeCompare(b.name) : b.updated - a.updated,
    )
  })
  const items = createMemo<DropdownMenuT.Item[]>(() => [
    {
      type: 'group',
      label: 'Visible fields',
      children: [
        {
          type: 'checkbox',
          label: 'Project owner',
          checked: showOwner(),
          onCheckedChange: setShowOwner,
        },
        {
          type: 'checkbox',
          label: 'Archived projects',
          checked: showArchived(),
          onCheckedChange: setShowArchived,
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Sort projects',
      icon: 'i-lucide:arrow-down-wide-narrow',
      children: [
        {
          type: 'radio',
          group: 'sort',
          label: 'Recently updated',
          value: 'updated',
          checked: sort() === 'updated',
          onValueChange: setSort,
        },
        {
          type: 'radio',
          group: 'sort',
          label: 'Name',
          value: 'name',
          checked: sort() === 'name',
          onValueChange: setSort,
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Reset view',
      icon: 'i-lucide:rotate-ccw',
      onSelect: () => {
        setShowArchived(false)
        setShowOwner(true)
        setSort('updated')
      },
    },
    {
      label: 'Save for everyone',
      description: 'Workspace administrator permission required',
      disabled: true,
      icon: 'i-lucide:lock',
    },
  ])

  return (
    <section
      class="p-4 border border-border rounded-lg bg-card max-w-lg w-full space-y-4"
      aria-label="Workspace projects"
    >
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h4 class="text-sm font-semibold">Workspace projects</h4>
          <p class="text-xs text-muted-foreground">
            Customize this view without changing project data.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenu.Trigger as={Button} variant="outline" leading="i-lucide:sliders-horizontal">
            View
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={items()} class="max-w-[calc(100vw-2rem)] w-72" />
        </DropdownMenu>
      </div>
      <ul class="divide-border divide-y">
        <For each={projects()}>
          {(project) => (
            <li class="text-sm py-3 flex gap-3 items-center justify-between">
              <span>
                {project.name}
                <Show when={project.archived}>
                  <span class="text-xs text-muted-foreground ms-2">Archived</span>
                </Show>
              </span>
              <Show when={showOwner()}>
                <span class="text-xs text-muted-foreground">{project.owner}</span>
              </Show>
            </li>
          )}
        </For>
      </ul>
      <p role="status" class="text-xs text-muted-foreground">
        {projects().length} projects · Sorted by {sort() === 'name' ? 'name' : 'recently updated'}
      </p>
    </section>
  )
}
