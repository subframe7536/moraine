import { For, Show, createMemo, createSignal } from 'solid-js'

import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Kbd,
  Popover,
  Select,
  Switch,
  Tabs,
  Tooltip,
} from '../../../../src'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

const PROJECTS = [
  { name: 'Component library', description: 'Shared primitives', initials: 'CL', status: 'Active' },
  {
    name: 'Documentation',
    description: 'Guides and examples',
    initials: 'DO',
    status: 'In review',
  },
  { name: 'Theme presets', description: 'Light and dark', initials: 'TP', status: 'Draft' },
] as const

export function ComponentCanvas() {
  const [filter, setFilter] = createSignal('')
  const [created, setCreated] = createSignal(false)
  const [view, setView] = createSignal('projects')
  const [updates, setUpdates] = createSignal(true)
  const [reviewed, setReviewed] = createSignal(false)
  const visibleProjects = createMemo(() =>
    [
      ...PROJECTS,
      ...(created()
        ? [{ name: 'New project', description: 'Draft', initials: 'NP', status: 'New' }]
        : []),
    ].filter((project) => project.name.toLowerCase().includes(filter().trim().toLowerCase())),
  )

  return (
    <section aria-labelledby="canvas-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <h2 id="canvas-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            A working set
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            Search, change a view, and review a handoff without leaving the page.
          </p>
        </div>
        <a href="/start" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Browse docs →
        </a>
      </div>
      <div class="border border-border/70 rounded-xl bg-card/50 grid overflow-hidden lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div class="p-4 border-b border-border/70 min-w-0 sm:p-6 lg:border-b-0 lg:border-r">
          <div class="flex gap-3 items-center justify-between">
            <div class="flex gap-2 items-center">
              <h3 class="text-sm font-semibold">Workspace</h3>
              <Badge variant="outline" size="sm">
                Projects
              </Badge>
            </div>
            <Tooltip>
              <Tooltip.Trigger
                as={Button}
                variant="outline"
                size="sm"
                leading="i-lucide:plus"
                onClick={() => setCreated(true)}
              >
                New
              </Tooltip.Trigger>
              <Tooltip.Content text="Add a draft project" />
            </Tooltip>
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
                  <div class="pt-3 min-h-32">
                    <Show
                      when={visibleProjects().length > 0}
                      fallback={
                        <p class="text-sm text-muted-foreground py-6">No matching projects.</p>
                      }
                    >
                      <ul class="m-0 p-0 list-none divide-border/70 divide-y">
                        <For each={visibleProjects()}>
                          {(project) => (
                            <li class="py-3 flex gap-3 min-w-0 items-center first:pt-0 last:pb-0">
                              <Avatar alt={project.name} text={project.initials} size="sm" />
                              <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">{project.name}</p>
                                <p class="text-xs text-muted-foreground truncate">
                                  {project.description}
                                </p>
                              </div>
                              <Badge variant="outline" size="sm">
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
                  <ul class="text-sm m-0 p-0 pt-3 list-none min-h-32 divide-border/70 divide-y">
                    <Show when={created()}>
                      <li class="py-3 flex gap-2 items-center justify-between first:pt-0">
                        <span>
                          <span class="font-medium">New project</span>
                          <span class="text-muted-foreground"> added to the workspace</span>
                        </span>
                        <Badge variant="outline" size="sm">
                          New
                        </Badge>
                      </li>
                    </Show>
                    <li class="py-3 flex gap-2 items-center justify-between first:pt-0">
                      <span>
                        <span class="font-medium">Documentation</span>
                        <span class="text-muted-foreground"> moved to review</span>
                      </span>
                      <Badge variant="surface" size="sm">
                        Review
                      </Badge>
                    </li>
                    <li class="py-3 flex gap-2 items-center justify-between last:pb-0">
                      <span>
                        <span class="font-medium">Theme presets</span>
                        <span class="text-muted-foreground"> saved as a draft</span>
                      </span>
                      <Badge variant="outline" size="sm">
                        Draft
                      </Badge>
                    </li>
                  </ul>
                ),
              },
            ]}
          />
        </div>
        <div class="flex flex-col min-w-0">
          <div class="p-4 flex-1 sm:p-6">
            <div class="flex gap-2 items-center justify-between">
              <h3 class="text-sm font-semibold">Preferences</h3>
              <Badge variant="surface" size="sm">
                Local
              </Badge>
            </div>
            <div class="mt-5 space-y-4">
              <Field label="View" description="Switch the workspace panel.">
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
              <div class="pt-4 border-t border-border/70">
                <Switch
                  label="Email updates"
                  description="Get notified when a release is ready."
                  checked={updates()}
                  onChange={setUpdates}
                />
              </div>
            </div>
          </div>
          <div class="text-xs text-muted-foreground px-4 py-3 border-t border-border/70 flex gap-2 items-center sm:px-6">
            <span>Search the docs</span>
            <Kbd value="⌘ K" variant="outline" class="ms-auto" />
          </div>
        </div>
        <div class="px-4 py-3 border-t border-border/70 flex flex-wrap gap-3 items-center sm:px-6 lg:col-span-2">
          <div class="flex-1 min-w-40">
            <p class="text-sm font-medium">Documentation handoff</p>
            <p class="text-xs text-muted-foreground">Review the update before marking it ready.</p>
          </div>
          <Badge variant={reviewed() ? 'surface' : 'outline'} size="sm">
            {reviewed() ? 'Ready' : 'In review'}
          </Badge>
          <Popover>
            <Popover.Trigger as={Button} variant="outline" size="sm">
              Review note
            </Popover.Trigger>
            <Popover.Content ariaLabel="Documentation review note">
              <div class="p-4 max-w-[calc(100vw-2rem)] w-64 space-y-3">
                <p class="text-sm font-medium">Documentation handoff</p>
                <p class="text-xs text-muted-foreground">
                  Check the examples and styling guide before marking this update ready.
                </p>
                <Button size="sm" onClick={() => setReviewed(true)} disabled={reviewed()}>
                  {reviewed() ? 'Marked ready' : 'Mark ready'}
                </Button>
              </div>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </section>
  )
}
