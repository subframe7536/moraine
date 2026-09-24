import { For, Show, createMemo, createSignal } from 'solid-js'

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Collapsible,
  Dialog,
  Field,
  Input,
  Kbd,
  Popover,
  Progress,
  Select,
  Switch,
  Tabs,
} from '../../../../src'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

const INITIAL_PROJECTS = [
  {
    id: 'core',
    name: 'Component library',
    description: 'Shared primitives and style recipes',
    initials: 'CL',
    status: 'Active',
    completion: 88,
  },
  {
    id: 'docs',
    name: 'Documentation site',
    description: 'Interactive guides and workbench',
    initials: 'DO',
    status: 'In review',
    completion: 65,
  },
  {
    id: 'themes',
    name: 'Theme presets',
    description: 'Light and dark design tokens',
    initials: 'TP',
    status: 'Active',
    completion: 94,
  },
]

export function ComponentCanvas() {
  const [projects, setProjects] = createSignal(INITIAL_PROJECTS)
  const [filter, setFilter] = createSignal('')
  const [view, setView] = createSignal('projects')
  const [updates, setUpdates] = createSignal(true)
  const [reviewed, setReviewed] = createSignal(false)
  const [newProjectOpen, setNewProjectOpen] = createSignal(false)
  const [newProjectName, setNewProjectName] = createSignal('')
  const [newProjectDesc, setNewProjectDesc] = createSignal('')

  const visibleProjects = createMemo(() =>
    projects().filter((project) =>
      project.name.toLowerCase().includes(filter().trim().toLowerCase()),
    ),
  )

  const handleCreateProject = () => {
    const name = newProjectName().trim()
    if (!name) {
      return
    }
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    setProjects((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        name,
        description: newProjectDesc().trim() || 'New workspace item',
        initials: initials || 'NP',
        status: 'Draft',
        completion: 15,
      },
    ])
    setNewProjectName('')
    setNewProjectDesc('')
    setNewProjectOpen(false)
  }

  return (
    <section aria-labelledby="canvas-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <h2 id="canvas-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Console workspace
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            Real Moraine components working in unison: search, view dispatch, and dialog handoffs.
          </p>
        </div>
        <a href="/start" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Browse components →
        </a>
      </div>

      <div class="border border-border/70 rounded-xl bg-card/40 grid overflow-hidden lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        {/* Left Column: Master Workspace */}
        <div class="p-4 border-b border-border/70 min-w-0 sm:p-6 lg:border-r lg:border-b-0">
          <div class="flex gap-3 items-center justify-between">
            <div class="flex gap-2 items-center">
              <h3 class="text-sm font-semibold">Workspace</h3>
              <Badge variant="outline" size="sm">
                {projects().length} Projects
              </Badge>
            </div>

            <Dialog open={newProjectOpen()} onOpenChange={setNewProjectOpen}>
              <Dialog.Trigger as={Button} variant="outline" size="sm" leading="i-lucide:plus">
                New
              </Dialog.Trigger>
              <Dialog.Content
                title="Create project"
                body={
                  <div class="pt-2 space-y-3">
                    <Field label="Project name">
                      <Input
                        placeholder="e.g. Design token registry"
                        value={newProjectName()}
                        onValueChange={setNewProjectName}
                      />
                    </Field>
                    <Field label="Description">
                      <Input
                        placeholder="Short summary..."
                        value={newProjectDesc()}
                        onValueChange={setNewProjectDesc}
                      />
                    </Field>
                    <div class="pt-3 flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewProjectOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateProject}
                        disabled={!newProjectName().trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                }
              />
            </Dialog>
          </div>

          <Field label="Filter projects" class="mt-4">
            <Input
              placeholder="Search by project name..."
              value={filter()}
              onValueChange={setFilter}
            />
          </Field>

          <Tabs
            value={view()}
            onChange={setView}
            size="sm"
            class="mt-4"
            items={[
              {
                value: 'projects',
                label: 'Projects',
                content: (
                  <div class="pt-3 min-h-36">
                    <Show
                      when={visibleProjects().length > 0}
                      fallback={
                        <p class="text-sm text-muted-foreground py-6 text-center">
                          No matching projects.
                        </p>
                      }
                    >
                      <ul class="m-0 p-0 list-none divide-border/60 divide-y">
                        <For each={visibleProjects()}>
                          {(project) => (
                            <li class="py-3 flex flex-wrap gap-3 min-w-0 items-center justify-between first:pt-0 last:pb-0">
                              <div class="flex flex-1 gap-3 min-w-0 items-center">
                                <Avatar alt={project.name} text={project.initials} size="sm" />
                                <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium truncate">{project.name}</p>
                                  <p class="text-xs text-muted-foreground truncate">
                                    {project.description}
                                  </p>
                                  <div class="mt-1.5 max-w-32">
                                    <Progress
                                      value={project.completion}
                                      size="sm"
                                      aria-label="Progress"
                                    />
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant={project.status === 'Active' ? 'surface' : 'outline'}
                                size="sm"
                              >
                                {project.status}
                              </Badge>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                  </div>
                ),
              },
              {
                value: 'activity',
                label: 'Activity',
                content: (
                  <ul class="text-sm m-0 p-0 pt-3 list-none min-h-36 divide-border/60 divide-y">
                    <li class="py-2.5 flex gap-2 items-center justify-between first:pt-0">
                      <span>
                        <span class="font-medium">Documentation site</span>
                        <span class="text-muted-foreground"> moved to review</span>
                      </span>
                      <Badge variant="surface" size="sm">
                        Review
                      </Badge>
                    </li>
                    <li class="py-2.5 flex gap-2 items-center justify-between">
                      <span>
                        <span class="font-medium">Component library</span>
                        <span class="text-muted-foreground"> updated to SolidJS 1.9</span>
                      </span>
                      <Badge variant="outline" size="sm">
                        Release
                      </Badge>
                    </li>
                    <li class="py-2.5 flex gap-2 items-center justify-between last:pb-0">
                      <span>
                        <span class="font-medium">Theme presets</span>
                        <span class="text-muted-foreground"> added OKLCH color support</span>
                      </span>
                      <Badge variant="outline" size="sm">
                        Tokens
                      </Badge>
                    </li>
                  </ul>
                ),
              },
            ]}
          />
        </div>

        {/* Right Column: Preferences & Controls */}
        <div class="bg-muted/10 flex flex-col min-w-0">
          <div class="p-4 flex-1 space-y-4 sm:p-6">
            <div class="flex gap-2 items-center justify-between">
              <h3 class="text-sm font-semibold">Preferences</h3>
              <Badge variant="surface" size="sm">
                Local
              </Badge>
            </div>

            <Field label="Active panel view" description="Switch the workspace perspective.">
              <Select
                items={[
                  { label: 'Projects', value: 'projects' },
                  { label: 'Activity', value: 'activity' },
                ]}
                value={view()}
                onChange={(value) => setView(value ?? 'projects')}
                class="w-full"
              />
            </Field>

            <div class="pt-3 border-t border-border/60">
              <Switch
                label="Notification sync"
                description="Trigger alerts on workflow changes."
                checked={updates()}
                onChange={setUpdates}
              />
            </div>

            <Collapsible title="Advanced settings" class="pt-2">
              <div class="text-xs text-muted-foreground p-2 rounded-md bg-muted/40 space-y-2">
                <p>Telemetry: Anonymized</p>
                <p>SSG Caching: Enabled</p>
              </div>
            </Collapsible>
          </div>

          <div class="text-xs text-muted-foreground px-4 py-3 border-t border-border/70 bg-card/60 flex gap-2 items-center sm:px-6">
            <span>Quick search shortcut</span>
            <Kbd value="⌘ K" variant="outline" class="ms-auto" />
          </div>
        </div>

        {/* Footer Row: Status & Actions */}
        <div class="px-4 py-3 border-t border-border/70 bg-muted/20 flex flex-wrap gap-3 items-center sm:px-6 lg:col-span-2">
          <div class="flex-1 min-w-48">
            <Breadcrumb
              items={[
                { label: 'Workspace' },
                { label: 'Moraine Core' },
                { label: 'Handoff review', active: true },
              ]}
              size="sm"
            />
          </div>

          <Badge variant={reviewed() ? 'surface' : 'outline'} size="sm">
            {reviewed() ? 'Approved' : 'Pending review'}
          </Badge>

          <Popover>
            <Popover.Trigger as={Button} variant="outline" size="sm">
              Review notes
            </Popover.Trigger>
            <Popover.Content ariaLabel="Documentation review note">
              <div class="p-4 max-w-[calc(100vw-2rem)] w-64 space-y-3">
                <p class="text-sm font-medium">Handoff checklist</p>
                <p class="text-xs text-muted-foreground">
                  Verify UnoCSS pipeline scans and responsive breakpoints before publishing.
                </p>
                <Button size="sm" onClick={() => setReviewed(true)} disabled={reviewed()}>
                  {reviewed() ? 'Marked complete' : 'Approve handoff'}
                </Button>
              </div>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </section>
  )
}
