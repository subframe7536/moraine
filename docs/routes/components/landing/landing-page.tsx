import { For, Show, createMemo, createSignal } from 'solid-js'

import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Input,
  Kbd,
  Select,
  Switch,
  Tabs,
  Tooltip,
} from '../../../../src'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

function HeroSpecimen() {
  const [release, setRelease] = createSignal('Autumn release')
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
        <div class="space-y-1.5">
          <label for="landing-release" class="text-sm font-medium">
            Release name
          </label>
          <Input id="landing-release" value={release()} onValueChange={setRelease} />
        </div>
        <Checkbox label="Include component previews" defaultChecked />
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
                <p class="text-sm text-muted-foreground">
                  {release() || 'Untitled release'} is ready for review.
                </p>
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
  { name: 'Component library', description: 'Design system', initials: 'CL', status: 'Active' },
  { name: 'Documentation', description: 'Content', initials: 'DO', status: 'In review' },
] as const

function ComponentCanvas() {
  const [filter, setFilter] = createSignal('')
  const [created, setCreated] = createSignal(false)
  const [view, setView] = createSignal('projects')
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
          <p class="text-sm text-muted-foreground mt-1">Components designed to share a surface.</p>
        </div>
        <a href="/start" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Browse docs →
        </a>
      </div>
      <div class="border border-border/70 rounded-xl bg-card/50 grid overflow-hidden lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div class="p-4 border-b border-border/70 min-w-0 sm:p-6 lg:border-r lg:border-b-0">
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
          <Input
            aria-label="Filter projects"
            placeholder="Filter projects..."
            value={filter()}
            onValueChange={setFilter}
            class="mt-4 w-full"
          />
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
                  <p class="text-sm text-muted-foreground py-6 min-h-32">
                    {created() ? 'New project was added to your workspace.' : 'No recent activity.'}
                  </p>
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
              <div class="space-y-1.5">
                <label for="landing-view" class="text-sm font-medium">
                  View
                </label>
                <Select
                  id="landing-view"
                  items={[
                    { label: 'Projects', value: 'projects' },
                    { label: 'Activity', value: 'activity' },
                  ]}
                  value={view()}
                  onChange={(value) => setView(value ?? 'projects')}
                  class="w-full"
                />
              </div>
              <div class="pt-4 border-t border-border/70">
                <Switch label="Email updates" defaultChecked />
              </div>
            </div>
          </div>
          <div class="text-xs text-muted-foreground px-4 py-3 border-t border-border/70 flex gap-2 items-center sm:px-6">
            <span>Search the docs</span>
            <Kbd value="⌘ K" variant="outline" class="ms-auto" />
          </div>
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
      <Input
        aria-label={props.customized ? 'Customized project name' : 'Default project name'}
        defaultValue="Moraine"
        variant={props.customized ? 'subtle' : 'outline'}
        classes={props.customized ? { root: 'rounded-xl' } : undefined}
      />
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
            Same components, different variants and slot classes.
          </p>
        </div>
        <a href="/styling" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Explore styling →
        </a>
      </div>
      <div class="mt-5 border border-border/70 rounded-xl bg-card grid overflow-hidden md:grid-cols-2">
        <div class="border-b border-border/70 md:border-r md:border-b-0">
          <StylingSpecimen />
        </div>
        <StylingSpecimen customized />
        <div class="text-xs text-muted-foreground font-mono px-4 py-3 border-t border-border/70 bg-muted/30 sm:px-6 md:col-span-2">
          variant="subtle" &nbsp; classes=&#123;&#123; root: 'rounded-xl' &#125;&#125;
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
          <p class="text-xs text-muted-foreground tracking-wider font-mono uppercase">
            Moraine / SolidJS
          </p>
          <h1
            id="landing-title"
            class="text-3xl leading-tight tracking-tight font-semibold mt-4 max-w-xl lg:text-5xl sm:text-4xl"
          >
            Components for SolidJS, without fighting your design system.
          </h1>
          <p class="text-sm text-muted-foreground leading-relaxed mt-4 max-w-lg sm:text-base">
            Compose useful interfaces with components that fit your styles.
          </p>
          <div class="mt-6 flex flex-wrap gap-3 items-center">
            <Button as="a" href="/start">
              Get started
            </Button>
            <Button as="a" href="/styling" variant="outline">
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
        <a href="/styling" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Styling guide →
        </a>
      </section>
    </div>
  )
}
