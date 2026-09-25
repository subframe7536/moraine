import type { JSX } from 'solid-js'
import { For, createSignal } from 'solid-js'

import {
  Accordion,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Combobox,
  Dialog,
  FileUpload,
  Input,
  InputNumber,
  Pagination,
  Popover,
  Progress,
  Slider,
  Stepper,
  Switch,
  Tabs,
  Tooltip,
} from '../../../../src'

const FRAMEWORKS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'UnoCSS', value: 'unocss' },
  { label: 'Tailwind CSS', value: 'tailwind' },
]

const SETUP_STEPS = [
  { value: 'plan', title: 'Plan', icon: 'i-lucide:clipboard-list' },
  { value: 'build', title: 'Build', icon: 'i-lucide:hammer' },
  { value: 'ship', title: 'Ship', icon: 'i-lucide:rocket' },
]

const SAMPLE_RELEASES = [
  { name: 'API review', status: 'Ready' },
  { name: 'Theme update', status: 'Shipped' },
  { name: 'Input polish', status: 'Shipped' },
  { name: 'Docs refresh', status: 'Shipped' },
  { name: 'Overlay pass', status: 'Shipped' },
  { name: 'Recipe audit', status: 'Shipped' },
]

interface RadarCardProps {
  title: string
  description: string
  components: string
  href: string
  children: JSX.Element
}

function RadarCard(props: RadarCardProps) {
  return (
    <div class="mb-4 break-inside-avoid">
      <Card as="article" size="sm" class="w-full">
        <Card.Header>
          <Card.Title as="h3">{props.title}</Card.Title>
          <Card.Description>{props.description}</Card.Description>
        </Card.Header>
        <Card.Body class="min-w-0">{props.children}</Card.Body>
        <Card.Footer class="justify-between text-xs">
          <span class="text-muted-foreground">{props.components}</span>
          <a
            href={props.href}
            aria-label={`${props.title} documentation`}
            class="text-primary whitespace-nowrap focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:underline"
          >
            Docs →
          </a>
        </Card.Footer>
      </Card>
    </div>
  )
}

export function ComponentRadar() {
  const [sliderValue, setSliderValue] = createSignal(42)
  const [cacheEnabled, setCacheEnabled] = createSignal(true)
  const [setupStep, setSetupStep] = createSignal('build')
  const [page, setPage] = createSignal(1)
  const [email, setEmail] = createSignal('team@moraine.dev')
  const [digestEnabled, setDigestEnabled] = createSignal(true)
  const [preferencesSaved, setPreferencesSaved] = createSignal(false)

  const setupStepIndex = () => SETUP_STEPS.findIndex((step) => step.value === setupStep())
  const setupProgress = () => ((setupStepIndex() + 1) / SETUP_STEPS.length) * 100
  const visibleReleases = () => SAMPLE_RELEASES.slice((page() - 1) * 2, page() * 2)

  return (
    <section aria-labelledby="radar-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 id="radar-title" class="tracking-tight font-semibold text-xl sm:text-2xl">
            Components working together
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Explore everyday workflows built with Moraine components.
          </p>
        </div>
        <Button as="a" href="/start" size="sm" variant="link" trailing="icon-arrow-right">
          Browse components
        </Button>
      </div>

      <div class="gap-4 columns-1 md:columns-2 xl:columns-3">
        <RadarCard
          title="Technology filter"
          description="Find the tools in a project stack."
          components="Combobox · Badge"
          href="/combobox"
        >
          <div class="space-y-3">
            <Combobox
              items={FRAMEWORKS}
              placeholder="Select technology..."
              allowClear
              class="w-full"
            />
            <div class="flex flex-wrap gap-1.5">
              <Badge variant="surface">SolidJS</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">UnoCSS</Badge>
            </div>
          </div>
        </RadarCard>

        <RadarCard
          title="Runtime limits"
          description="Tune capacity before a deployment."
          components="Slider · InputNumber"
          href="/slider"
        >
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">CPU threshold</span>
                <span class="font-mono font-semibold">{sliderValue()}%</span>
              </div>
              <Slider
                value={sliderValue()}
                onValueChange={(value) => setSliderValue(Array.isArray(value) ? value[0]! : value)}
                min={0}
                max={100}
                aria-label="CPU threshold"
              />
            </div>
            <div class="pt-3 border-t border-border/60 flex gap-3 items-center justify-between">
              <span class="text-muted-foreground text-xs">Replica count</span>
              <InputNumber
                defaultValue={3}
                minValue={1}
                maxValue={12}
                size="sm"
                aria-label="Replica count"
                class="w-28"
              />
            </div>
          </div>
        </RadarCard>

        <RadarCard
          title="Cache policy"
          description="Control response caching locally."
          components="Switch · Tooltip · Badge"
          href="/switch"
        >
          <div class="space-y-3">
            <Switch
              label="Automatic caching"
              description="Keep recent responses available."
              checked={cacheEnabled()}
              onCheckedChange={setCacheEnabled}
            />
            <div class="pt-3 border-t border-border/60 flex gap-2 items-center justify-between">
              <Badge variant={cacheEnabled() ? 'solid' : 'outline'}>
                {cacheEnabled() ? 'Enabled' : 'Paused'}
              </Badge>
              <Tooltip>
                <Tooltip.Trigger as={Button} variant="ghost" size="sm">
                  Why cache?
                </Tooltip.Trigger>
                <Tooltip.Content text="This preview only changes local state." />
              </Tooltip>
            </div>
          </div>
        </RadarCard>

        <RadarCard
          title="Team access"
          description="See people and their workspace roles."
          components="Avatar · Badge"
          href="/avatar"
        >
          <div class="space-y-3">
            <div class="flex gap-3 items-center">
              <Avatar alt="Avery Chen" text="AC" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-xs">Avery Chen</p>
                <p class="text-muted-foreground text-xs">Workspace owner</p>
              </div>
              <Badge variant="surface">Owner</Badge>
            </div>
            <div class="flex gap-3 items-center">
              <Avatar alt="Morgan Lee" text="ML" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-xs">Morgan Lee</p>
                <p class="text-muted-foreground text-xs">Product design</p>
              </div>
              <Badge variant="outline">Editor</Badge>
            </div>
            <div class="flex gap-3 items-center">
              <Avatar alt="Sam Rivera" text="SR" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-xs">Sam Rivera</p>
                <p class="text-muted-foreground text-xs">Engineering</p>
              </div>
              <Badge variant="outline">Editor</Badge>
            </div>
          </div>
        </RadarCard>

        <RadarCard
          title="Setup progress"
          description="Move through a three-step workflow."
          components="Stepper · Progress · Button"
          href="/stepper"
        >
          <div class="space-y-4">
            <Stepper
              items={SETUP_STEPS}
              value={setupStep()}
              onChange={setSetupStep}
              linear={false}
              size="sm"
            />
            <div class="space-y-2">
              <div class="text-muted-foreground flex justify-between text-xs">
                <span>Workflow completion</span>
                <span class="text-foreground font-mono">{Math.round(setupProgress())}%</span>
              </div>
              <Progress value={setupProgress()} aria-label="Workflow completion" />
            </div>
            <div class="flex gap-2 justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={setupStepIndex() === 0}
                onClick={() => setSetupStep(SETUP_STEPS[setupStepIndex() - 1]!.value)}
              >
                Back
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={setupStepIndex() === SETUP_STEPS.length - 1}
                onClick={() => setSetupStep(SETUP_STEPS[setupStepIndex() + 1]!.value)}
              >
                Next
              </Button>
            </div>
          </div>
        </RadarCard>

        <RadarCard
          title="Content views"
          description="Switch between project perspectives."
          components="Tabs · Badge"
          href="/tabs"
        >
          <Tabs
            size="sm"
            items={[
              {
                value: 'preview',
                label: 'Preview',
                get content() {
                  return (
                    <div class="pt-3 flex gap-2 items-center justify-between">
                      <span class="text-muted-foreground text-xs">Live component preview</span>
                      <Badge variant="surface">Ready</Badge>
                    </div>
                  )
                },
              },
              {
                value: 'code',
                label: 'Code',
                get content() {
                  return (
                    <p class="text-muted-foreground pt-3 text-xs">
                      Copy the TSX example from its component page.
                    </p>
                  )
                },
              },
              {
                value: 'notes',
                label: 'Notes',
                get content() {
                  return (
                    <p class="text-muted-foreground pt-3 text-xs">
                      Review behavior and accessibility guidance.
                    </p>
                  )
                },
              },
            ]}
          />
        </RadarCard>

        <RadarCard
          title="Release notes"
          description="Expand the details that matter."
          components="Accordion · Badge"
          href="/accordion"
        >
          <div class="space-y-2">
            <Badge variant="outline">2 updates</Badge>
            <Accordion
              items={[
                {
                  value: 'components',
                  label: 'Component changes',
                  content: 'Review API updates and migration notes.',
                },
                {
                  value: 'styling',
                  label: 'Styling changes',
                  content: 'Check tokens, recipes, and variant behavior.',
                },
              ]}
              defaultValue={['components']}
            />
          </div>
        </RadarCard>

        <RadarCard
          title="Change review"
          description="Pause before applying a setting."
          components="Dialog · Button"
          href="/dialog"
        >
          <div class="flex gap-3 items-center justify-between">
            <p class="text-muted-foreground max-w-40 text-xs">
              Review the action in a focused layer.
            </p>
            <Dialog>
              <Dialog.Trigger as={Button} size="sm">
                Review
              </Dialog.Trigger>
              <Dialog.Content
                title="Review changes"
                body={
                  <p class="text-muted-foreground text-sm">
                    This example opens a dialog without changing saved data.
                  </p>
                }
              />
            </Dialog>
          </div>
        </RadarCard>

        <RadarCard
          title="Quick actions"
          description="Reveal tools without leaving the page."
          components="Popover · Tooltip · Button"
          href="/popover"
        >
          <div class="flex flex-wrap gap-2 items-center">
            <Popover>
              <Popover.Trigger as={Button} variant="outline" size="sm">
                Open actions
              </Popover.Trigger>
              <Popover.Content ariaLabel="Quick actions">
                <div class="p-3 max-w-48 space-y-1">
                  <p class="font-medium text-xs">Workspace tools</p>
                  <p class="text-muted-foreground text-xs">
                    Actions can stay close to the selected item.
                  </p>
                </div>
              </Popover.Content>
            </Popover>
            <Tooltip>
              <Tooltip.Trigger as={Button} variant="ghost" size="sm">
                Help
              </Tooltip.Trigger>
              <Tooltip.Content text="Press Escape to close an open layer." />
            </Tooltip>
          </div>
        </RadarCard>

        <RadarCard
          title="Asset handoff"
          description="Stage files before sending them."
          components="FileUpload · Badge"
          href="/file-upload"
        >
          <div class="space-y-3">
            <FileUpload
              size="sm"
              multiple
              accept=".pdf,.png,.jpg"
              maxFiles={3}
              label="Add project files"
              description="PDF or image, up to three files"
            />
            <Badge variant="outline">Files stay local in this preview</Badge>
          </div>
        </RadarCard>

        <RadarCard
          title="Sample results"
          description="Page through an example release queue."
          components="Pagination · Badge"
          href="/pagination"
        >
          <div class="space-y-3">
            <div class="divide-border divide-y">
              <For each={visibleReleases()}>
                {(release) => (
                  <div class="py-2 flex gap-2 items-center justify-between">
                    <span class="font-medium text-xs">{release.name}</span>
                    <Badge variant={release.status === 'Ready' ? 'surface' : 'outline'}>
                      {release.status}
                    </Badge>
                  </div>
                )}
              </For>
            </div>
            <Pagination
              page={page()}
              onPageChange={setPage}
              total={SAMPLE_RELEASES.length}
              itemsPerPage={2}
              siblingCount={0}
              prevText="Prev"
              nextText="Next"
            />
          </div>
        </RadarCard>

        <RadarCard
          title="Notification preferences"
          description="Edit and save a local preference."
          components="Input · Checkbox · Button"
          href="/checkbox"
        >
          <form
            class="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setPreferencesSaved(true)
            }}
          >
            <label class="font-medium block text-xs" for="radar-notification-email">
              Email address
            </label>
            <Input
              id="radar-notification-email"
              type="email"
              value={email()}
              onValueChange={(value) => {
                setEmail(value)
                setPreferencesSaved(false)
              }}
              class="w-full"
            />
            <Checkbox
              label="Weekly digest"
              checked={digestEnabled()}
              onCheckedChange={(value) => {
                setDigestEnabled(value)
                setPreferencesSaved(false)
              }}
            />
            <div class="pt-2 flex gap-2 items-center justify-between">
              <span class="text-muted-foreground text-xs" aria-live="polite">
                {preferencesSaved() ? 'Saved locally' : 'Preview only'}
              </span>
              <Button type="submit" size="sm">
                Save
              </Button>
            </div>
          </form>
        </RadarCard>
      </div>
    </section>
  )
}
