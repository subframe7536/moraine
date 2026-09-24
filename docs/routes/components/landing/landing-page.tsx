import { For, Show, createMemo, createSignal } from 'solid-js'

import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
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

function HeroSpecimen() {
  const [release, setRelease] = createSignal('Autumn release')
  const [audience, setAudience] = createSignal('team')
  const [previews, setPreviews] = createSignal(true)
  const [saved, setSaved] = createSignal(false)

  return (
    <Card
      compact
      title="Release settings"
      description="Prepare your next update"
      action={<Badge variant="outline">Draft</Badge>}
      class="min-w-0 w-full shadow-sm"
      classes={{ header: 'border-b border-border/70' }}
    >
      <form
        class="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <Field label="Release name" description="Appears in the update list.">
          <Input
            value={release()}
            onValueChange={(value) => {
              setRelease(value)
              setSaved(false)
            }}
          />
        </Field>
        <Field label="Audience">
          <Select
            items={[
              { label: 'Team', value: 'team' },
              { label: 'Public', value: 'public' },
            ]}
            value={audience()}
            onChange={(value) => {
              setAudience(value ?? 'team')
              setSaved(false)
            }}
          />
        </Field>
        <Checkbox
          label="Include component previews"
          checked={previews()}
          onChange={(value) => {
            setPreviews(value)
            setSaved(false)
          }}
        />
        <div class="pt-3 border-t border-border/70 flex flex-wrap gap-2 items-center">
          <Button type="submit" size="sm">
            Save changes
          </Button>
          <Dialog>
            <Dialog.Trigger as={Button} type="button" variant="outline" size="sm">
              Review
            </Dialog.Trigger>
            <Dialog.Content
              title="Release preview"
              body={
                <div class="text-sm space-y-2">
                  <p>{release() || 'Untitled release'} is ready for review.</p>
                  <p class="text-muted-foreground">
                    Audience: {audience() === 'team' ? 'Team' : 'Public'} · Component previews{' '}
                    {previews() ? 'included' : 'excluded'}.
                  </p>
                </div>
              }
            />
          </Dialog>
          <output aria-live="polite" class="text-xs text-muted-foreground ms-auto">
            {saved() ? 'Changes saved' : 'Not saved'}
          </output>
        </div>
      </form>
    </Card>
  )
}

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

function ComponentCanvas() {
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

function StylingSpecimen(props: { customized?: boolean }) {
  const [created, setCreated] = createSignal(false)

  return (
    <div class="p-4 min-w-0 space-y-4 sm:p-6">
      <h3 class="text-sm font-semibold">{props.customized ? 'Customized' : 'Default'}</h3>
      <div class="flex gap-3 items-center">
        <Badge
          variant={props.customized ? 'surface' : 'solid'}
          class={props.customized ? 'uppercase tracking-wider' : undefined}
        >
          Ready
        </Badge>
        <span class="text-sm font-medium">New project</span>
      </div>
      <Field label="Project name">
        <Input
          defaultValue="Moraine"
          variant={props.customized ? 'subtle' : 'outline'}
          classes={props.customized ? { root: 'rounded-xl' } : undefined}
        />
      </Field>
      <Button
        size="sm"
        variant={props.customized ? 'outline' : 'default'}
        classes={props.customized ? { root: 'rounded-full', label: 'tracking-wide' } : undefined}
        onClick={() => setCreated(true)}
      >
        {created() ? 'Project created' : 'Create project'}
      </Button>
    </div>
  )
}

function StylingShowcase() {
  return (
    <section aria-labelledby="styling-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Shape it your way
          </h2>
          <p class="text-sm text-muted-foreground mt-1 max-w-xl">
            Change variants and slot classes; semantic tokens carry the result across themes.
          </p>
        </div>
        <a
          href="/styling/customization"
          class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}
        >
          Explore styling →
        </a>
      </div>
      <div class="mt-5 border border-border/70 rounded-xl bg-card grid overflow-hidden md:grid-cols-2">
        <div class="border-b border-border/70 md:border-b-0 md:border-r">
          <StylingSpecimen />
        </div>
        <StylingSpecimen customized />
        <div class="text-xs text-muted-foreground font-mono px-4 py-3 border-t border-border/70 bg-muted/30 sm:px-6 md:col-span-2">
          variant="subtle" &nbsp; classes=&#123;&#123; root: 'rounded-xl' &#125;&#125;
        </div>
      </div>
      <div class="mt-4 px-4 py-3 border border-border/70 rounded-lg flex flex-wrap gap-x-6 gap-y-3 items-center sm:px-6">
        <span class="text-xs text-muted-foreground">Shared color roles</span>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-background size-4" aria-hidden="true" />
          <code>background</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-card size-4" aria-hidden="true" />
          <code>card</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-primary size-4" aria-hidden="true" />
          <code>primary</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-ring size-4" aria-hidden="true" />
          <code>ring</code>
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <div class="mx-auto px-5 max-w-6xl sm:px-8">
      <section
        aria-labelledby="landing-title"
        class="py-10 gap-8 grid items-center lg:py-20 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
      >
        <div class="min-w-0">
          <h1
            id="landing-title"
            class="text-3xl leading-tight tracking-tight font-semibold max-w-xl lg:text-5xl sm:text-4xl"
          >
            SolidJS components that fit your design system.
          </h1>
          <p class="text-sm text-muted-foreground leading-relaxed mt-4 max-w-lg sm:text-base">
            Compose forms, navigation, and overlays. Tune their variants and slots to make them
            yours.
          </p>
          <div class="mt-6 flex flex-wrap gap-3 items-center">
            <Button as="a" href="/start">
              Get started
            </Button>
            <Button as="a" href="/styling/unocss" variant="outline">
              Styling guide
            </Button>
          </div>
          <code class="text-xs text-muted-foreground font-mono mt-5 px-3 py-2 border border-border/70 rounded-md bg-muted/40 inline-block">
            pnpm add moraine
          </code>
        </div>
        <div class="min-w-0">
          <HeroSpecimen />
        </div>
      </section>
      <ComponentCanvas />
      <StylingShowcase />
      <section
        aria-labelledby="quick-start-title"
        class="py-8 border-t border-border/70 flex flex-wrap gap-4 items-center sm:py-10"
      >
        <div class="me-auto">
          <h2 id="quick-start-title" class="text-lg tracking-tight font-semibold">
            Start building
          </h2>
          <code class="text-xs text-muted-foreground font-mono mt-1 block">pnpm add moraine</code>
        </div>
        <Button as="a" href="/start" size="sm">
          Get started
        </Button>
        <a
          href="/styling/unocss"
          class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}
        >
          Styling guide →
        </a>
      </section>
    </div>
  )
}
