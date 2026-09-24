import { createSignal } from 'solid-js'

import { Badge, Button, Card, Checkbox, Dialog, Input, Kbd, Switch, Tabs } from '../../../../src'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

function HeroSpecimen() {
  const [release, setRelease] = createSignal('Autumn release')
  const [saved, setSaved] = createSignal(false)

  return (
    <Card
      title="Release settings"
      description="Configure your next update"
      action={<Badge variant="outline">Draft</Badge>}
      class="min-w-0 w-full shadow-sm"
    >
      <form
        class="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <div class="space-y-2">
          <label for="landing-release" class="text-sm font-medium">
            Release name
          </label>
          <Input id="landing-release" value={release()} onValueChange={setRelease} />
        </div>
        <Checkbox label="Include preview" defaultChecked />
        <div class="flex flex-wrap gap-2 items-center">
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
        </div>
        <output aria-live="polite" class="text-xs text-muted-foreground min-h-4 block">
          {saved() ? `Saved: ${release() || 'Untitled release'}` : 'Changes stay in this preview.'}
        </output>
      </form>
    </Card>
  )
}

function ComponentCanvas() {
  const [page, setPage] = createSignal(1)
  return (
    <section aria-labelledby="canvas-title" class="py-16 border-t border-border/70 sm:py-20">
      <div class="mb-7 flex gap-3 items-baseline justify-between">
        <h2 id="canvas-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
          Made to work together
        </h2>
        <a href="/start" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
          Browse docs →
        </a>
      </div>
      <div class="border border-border/70 rounded-xl bg-card/50 overflow-hidden">
        <div class="p-5 border-b border-border/70 flex flex-wrap gap-3 items-center sm:p-7">
          <Badge>Active</Badge>
          <Badge variant="outline">In review</Badge>
          <span class="text-xs text-muted-foreground ml-auto hidden sm:inline">
            Workspace / Releases
          </span>
        </div>
        <div class="p-5 gap-7 grid items-start sm:p-7 md:grid-cols-2">
          <div class="min-w-0 space-y-5">
            <Tabs
              defaultValue="overview"
              size="sm"
              items={[
                {
                  value: 'overview',
                  label: 'Overview',
                  content: <p class="text-sm text-muted-foreground pt-3">A clear place to work.</p>,
                },
                {
                  value: 'activity',
                  label: 'Activity',
                  content: <p class="text-sm text-muted-foreground pt-3">Nothing new yet.</p>,
                },
              ]}
            />
            <Input aria-label="Filter releases" placeholder="Filter releases..." />
          </div>
          <div class="min-w-0 space-y-5">
            <Switch label="Notifications" defaultChecked />
            <div class="flex flex-wrap gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page() - 1))}
                disabled={page() === 1}
              >
                Previous
              </Button>
              <span class="text-xs text-muted-foreground" aria-live="polite">
                Page {page()}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(page() + 1)}>
                Next
              </Button>
              <Kbd value="⌘ K" variant="outline" class="ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StylingSpecimen(props: { customized?: boolean }) {
  return (
    <div class="p-5 border border-border/70 rounded-xl bg-card min-w-0 space-y-5 sm:p-6">
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
      >
        Create project
      </Button>
    </div>
  )
}

function StylingShowcase() {
  return (
    <section aria-labelledby="styling-title" class="py-16 border-t border-border/70 sm:py-20">
      <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
        Shape it your way
      </h2>
      <p class="text-sm text-muted-foreground mt-3 max-w-xl">
        Variants and slot classes let the same components take on a different shape.
      </p>
      <div class="mt-8 gap-4 grid items-end md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div class="min-w-0">
          <h3 class="text-sm font-medium mb-3">Default</h3>
          <StylingSpecimen />
        </div>
        <span aria-hidden="true" class="text-muted-foreground pb-16 hidden md:block">
          →
        </span>
        <div class="min-w-0">
          <h3 class="text-sm font-medium mb-3">Customized</h3>
          <StylingSpecimen customized />
        </div>
      </div>
      <a
        href="/styling"
        class={`text-sm text-primary mt-6 inline-block hover:text-primary-hover ${linkFocus}`}
      >
        Explore styling →
      </a>
    </section>
  )
}

export function LandingPage() {
  return (
    <div class="mx-auto px-5 max-w-7xl sm:px-8">
      <section
        aria-labelledby="landing-title"
        class="py-16 gap-10 grid items-center lg:py-30 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
      >
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground tracking-wider font-mono uppercase">
            Moraine / SolidJS
          </p>
          <h1
            id="landing-title"
            class="text-4xl tracking-tight font-semibold mt-5 max-w-2xl lg:text-6xl sm:text-5xl"
          >
            Components for SolidJS, without fighting your design system.
          </h1>
          <p class="text-base text-muted-foreground leading-relaxed mt-6 max-w-lg">
            Compose useful interfaces with components that fit your styles.
          </p>
          <div class="mt-8 flex flex-wrap gap-3 items-center">
            <Button as="a" href="/start">
              Get started
            </Button>
            <Button as="a" href="/styling" variant="outline">
              Styling guide
            </Button>
          </div>
          <code class="text-xs text-muted-foreground font-mono mt-7 px-3 py-2 border border-border/70 rounded-md bg-muted/40 inline-block">
            pnpm add moraine
          </code>
        </div>
        <div class="min-w-0">
          <HeroSpecimen />
        </div>
      </section>
      <ComponentCanvas />
      <StylingShowcase />
      <section aria-labelledby="quick-start-title" class="py-16 border-t border-border/70 sm:py-20">
        <h2 id="quick-start-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
          Start building
        </h2>
        <div class="mt-5 flex flex-wrap gap-4 items-center">
          <code class="text-sm font-mono px-4 py-3 border border-border rounded-lg bg-muted/40">
            pnpm add moraine
          </code>
          <Button as="a" href="/start" size="sm">
            Get started
          </Button>
          <a href="/styling" class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}>
            Styling guide →
          </a>
        </div>
      </section>
    </div>
  )
}
