import { createSignal } from 'solid-js'
import type { JSX } from 'solid-js'

import {
  Accordion,
  Badge,
  BoldSlider,
  Button,
  Combobox,
  CopyButton,
  Dialog,
  Icon,
  MultiSelect,
  NumberInput,
  PinInput,
  Popover,
  Resizable,
  Slider,
  Stepper,
  Switch,
  Tabs,
  cn,
} from '../../../../src'
import { createMediaQuery } from '../../../../src/utils'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

const OPTIONS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'UnoCSS', value: 'unocss' },
  { label: 'Tailwind CSS', value: 'tailwind' },
]

const COMPOSITE_SNIPPET = `<Select
  items={frameworks}
  value={value()}
  onValueChange={setValue}
  placeholder="Choose framework"
  clearable
/>`

const GRANULAR_SNIPPET = `<BaseSelect items={frameworks} value={value()} onValueChange={setValue}>
  <BaseSelect.Control>
    <BaseSelect.Trigger>...</BaseSelect.Trigger>
  </BaseSelect.Control>
  <BaseSelect.Content>
    <BaseSelect.Listbox>
      <For each={frameworks}>
        {(item) => <BaseSelect.Item item={item} />}
      </For>
    </BaseSelect.Listbox>
  </BaseSelect.Content>
</BaseSelect>`

const UNOCSS_SNIPPET = `import { defineConfig } from 'unocss'
import { presetMoraine } from 'moraine/theme/unocss'

export default defineConfig({
  presets: [presetMoraine()],
})`

const TAILWIND_SNIPPET = `@import "tailwindcss";
@import "moraine/theme/tailwind.css";
@source "../node_modules/moraine/dist";`

const docsLinkClass = `group text-primary text-sm font-medium inline-flex gap-1 items-center hover:underline ${DOCS_FOCUS_RING_OFFSET_CLASS}`

function SamplerItem(props: {
  title: string
  description: string
  href: string
  class?: string
  children: JSX.Element
}) {
  return (
    <article
      class={cn('p-5 border-b border-e border-border flex flex-col min-w-0 sm:p-6', props.class)}
    >
      <div>
        <h3 class="text-base font-semibold">{props.title}</h3>
        <p class="text-sm text-muted-foreground mt-1">{props.description}</p>
      </div>
      <div class="mt-6 min-w-0">{props.children}</div>
      <a href={props.href} class={cn(docsLinkClass, 'mt-auto pt-6')}>
        Explore {props.title}{' '}
        <Icon
          name="i-lucide:arrow-up-right"
          class="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
        />
      </a>
    </article>
  )
}

function CodeCompareCard(props: {
  title: string
  description: string
  badge: string
  badgeVariant: 'soft' | 'outline'
  code: string
}) {
  return (
    <div class="p-5 border border-border rounded-xl bg-card flex flex-col gap-4 min-w-0">
      <div class="flex gap-3 items-start justify-between">
        <div>
          <h3 class="text-sm font-semibold">{props.title}</h3>
          <p class="text-xs text-muted-foreground mt-0.5">{props.description}</p>
        </div>
        <Badge size="sm" variant={props.badgeVariant}>
          {props.badge}
        </Badge>
      </div>

      <div class="flex-1 relative">
        <div class="right-2 top-2 absolute">
          <CopyButton value={props.code} size="icon-xs" variant="outline" />
        </div>
        <pre class="text-xs leading-5 p-3.5 border border-border/70 rounded-lg bg-muted/30 h-full overflow-x-auto">
          <code>{props.code}</code>
        </pre>
      </div>
    </div>
  )
}

export function ComponentRadar() {
  const isDesktop = createMediaQuery('(min-width: 768px)')
  const [value, setValue] = createSignal(42)
  const [boldValue, setBoldValue] = createSignal(70)
  const [emailAlerts, setEmailAlerts] = createSignal(true)
  const [inAppAlerts, setInAppAlerts] = createSignal(false)
  const [pinCode, setPinCode] = createSignal<string[]>(['4', '2', '', ''])
  const [engineTab, setEngineTab] = createSignal('unocss')

  return (
    <section aria-labelledby="radar-title" class="py-10 space-y-14 sm:py-14">
      {/* 1. Interactive Component Sampler */}
      <div>
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <h2 id="radar-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
              Explore the component kit.
            </h2>
            <p class="text-sm text-muted-foreground mt-2 sm:text-base">
              Try live controls spanning navigation, forms, overlays, and multi-step flows — all
              styled, accessible, and reactive out of the box.
            </p>
          </div>
          <Button
            as="a"
            href="/components"
            size="sm"
            variant="link"
            trailing="icon-arrow-right"
            class="shrink-0 self-start sm:self-end"
          >
            Browse all components
          </Button>
        </div>

        <div class="border-s border-t border-border rounded-xl grid overflow-hidden lg:auto-rows-[minmax(14rem,auto)] lg:grid-cols-4 md:grid-cols-2">
          <SamplerItem
            title="Tabs"
            description="Composable compound navigation with roving keyboard focus and animated panels."
            href="/components/tabs"
            class="md:col-span-2"
          >
            <div class="max-w-xl">
              <Tabs
                size="sm"
                defaultValue="preferences"
                items={[
                  {
                    label: 'Preferences',
                    value: 'preferences',
                    content: (
                      <div class="pt-4">
                        <p class="text-sm font-medium">Workspace preferences</p>
                        <p class="text-sm text-muted-foreground mt-1">
                          Choose how this workspace looks and feels.
                        </p>
                        <dl class="text-sm mt-4 pt-3 gap-4 grid grid-cols-2">
                          <div>
                            <dt class="text-muted-foreground">Appearance</dt>
                            <dd class="font-medium mt-1">System theme</dd>
                          </div>
                          <div>
                            <dt class="text-muted-foreground">Density</dt>
                            <dd class="font-medium mt-1">Comfortable</dd>
                          </div>
                        </dl>
                      </div>
                    ),
                  },
                  {
                    label: 'Access',
                    value: 'access',
                    content: (
                      <div class="pt-4">
                        <p class="text-sm font-medium">Workspace access</p>
                        <p class="text-sm text-muted-foreground mt-1">
                          Manage who can view and join this workspace.
                        </p>
                        <dl class="text-sm mt-4 pt-3 gap-4 grid grid-cols-2">
                          <div>
                            <dt class="text-muted-foreground">Visibility</dt>
                            <dd class="font-medium mt-1">Private</dd>
                          </div>
                          <div>
                            <dt class="text-muted-foreground">Invitations</dt>
                            <dd class="font-medium mt-1">Members only</dd>
                          </div>
                        </dl>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </SamplerItem>

          <SamplerItem
            title="Slider"
            description="Continuous numeric controls — raw slider track and composite BoldSlider."
            href="/components/slider"
          >
            <div class="max-w-sm space-y-5">
              <div>
                <div class="text-sm mb-2 flex justify-between">
                  <span>Default</span>
                  <output class="text-muted-foreground font-mono">{value()}</output>
                </div>
                <Slider
                  aria-label="Default slider example"
                  value={value()}
                  min={0}
                  max={100}
                  onValueChange={(next) => setValue(Array.isArray(next) ? next[0]! : next)}
                />
              </div>
              <BoldSlider
                label="Bold"
                value={boldValue()}
                min={0}
                max={100}
                step={10}
                markers
                onValueChange={setBoldValue}
              />
            </div>
          </SamplerItem>

          <SamplerItem
            title="Switch"
            description="Ready composite toggles with integrated label and description layout."
            href="/components/switch"
          >
            <div class="space-y-4">
              <Switch
                label="Email alerts"
                description="Sent after a deployment."
                checked={emailAlerts()}
                onCheckedChange={setEmailAlerts}
              />
              <Switch
                label="In-app alerts"
                description="Shown in your workspace."
                checked={inAppAlerts()}
                onCheckedChange={setInAppAlerts}
              />
            </div>
            <output aria-live="polite" class="text-xs text-muted-foreground mt-4 block">
              {Number(emailAlerts()) + Number(inAppAlerts())} of 2 channels on
            </output>
          </SamplerItem>

          <SamplerItem
            title="Popover"
            description="Granular floating primitives with collision-aware positioning and anchored trigger."
            href="/components/popover"
          >
            <Popover placement="bottom" align="start">
              <Popover.Trigger as={Button} variant="outline" size="sm">
                Open popover
              </Popover.Trigger>
              <Popover.Content aria-label="Popover example" class="max-w-56 w-[calc(100vw-3rem)]">
                <div class="p-4 space-y-1">
                  <p class="text-sm font-medium">Contextual content</p>
                  <p class="text-xs text-muted-foreground">
                    This panel stays close to the action that opened it.
                  </p>
                </div>
              </Popover.Content>
            </Popover>
          </SamplerItem>

          <SamplerItem
            title="NumberInput"
            description="Drop-in composite stepper with strict boundaries and increment controls."
            href="/components/number-input"
          >
            <NumberInput aria-label="Item count" defaultValue={3} min={1} max={10} />
          </SamplerItem>

          <SamplerItem
            title="Combobox"
            description="Full-featured composite select with typeahead search and clearable input."
            href="/components/combobox"
          >
            <Combobox items={OPTIONS} placeholder="Search technologies..." clearable />
          </SamplerItem>

          <SamplerItem
            title="Dialog"
            description="Decomposed modal parts (Trigger, Content, Body) for flexible composition."
            href="/components/dialog"
          >
            <Dialog>
              <Dialog.Trigger as={Button} variant="outline" size="sm">
                Open dialog
              </Dialog.Trigger>
              <Dialog.Content title="Dialog example">
                <Dialog.Body>
                  <p class="text-sm text-muted-foreground">
                    A focused space for content that needs a response.
                  </p>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog>
          </SamplerItem>

          <SamplerItem
            title="Accordion"
            description="Collapsible disclosure system with smooth transitions and keyboard roving."
            href="/components/accordion"
            class="lg:col-span-2 lg:col-start-3 lg:row-span-2 lg:row-start-2 md:col-span-2"
          >
            <Accordion
              defaultValue={['keyboard']}
              items={[
                {
                  value: 'keyboard',
                  label: 'Keyboard support',
                  content:
                    'Move between triggers with the arrow keys and activate one with Enter or Space.',
                },
                {
                  value: 'focus',
                  label: 'Focus management',
                  content:
                    'Each trigger keeps a visible focus state while its panel opens or closes.',
                },
                {
                  value: 'content',
                  label: 'Flexible content',
                  content: 'Place text, links, or a richer layout inside any panel.',
                },
              ]}
              classes={{
                root: 'border border-border rounded-lg',
                trigger: 'px-4',
                content: 'px-4',
              }}
            />
          </SamplerItem>

          <SamplerItem
            title="PinInput"
            description="Segmented verification input with paste handling and automatic focus advance."
            href="/components/pin-input"
          >
            <PinInput
              size="sm"
              length={4}
              value={pinCode()}
              onValueChange={setPinCode}
              aria-label="Verification code"
            />
            <output aria-live="polite" class="text-xs text-muted-foreground font-mono mt-3 block">
              {pinCode().filter(Boolean).length}/4 digits entered
            </output>
          </SamplerItem>

          <SamplerItem
            title="MultiSelect"
            description="Searchable multi-value selector with removable tags and keyboard backspace."
            href="/components/multi-select"
          >
            <MultiSelect
              size="sm"
              items={OPTIONS}
              defaultValue={['solid', 'unocss']}
              placeholder="Select stack..."
              clearable
            />
          </SamplerItem>

          <SamplerItem
            title="Stepper"
            description="Structured multi-step indicator with clickable transitions and active panels."
            href="/components/stepper"
            class="md:col-span-2"
          >
            <Stepper
              size="sm"
              defaultValue="configure"
              items={[
                {
                  value: 'install',
                  label: 'Install',
                  description: 'Add Moraine',
                  content: (
                    <p class="text-sm text-muted-foreground pt-3">
                      Install the core package and optional peer entries only when needed.
                    </p>
                  ),
                },
                {
                  value: 'configure',
                  label: 'Configure',
                  description: 'Connect CSS',
                  content: (
                    <p class="text-sm text-muted-foreground pt-3">
                      Register the UnoCSS preset or Tailwind CSS v4 theme import to unlock tokens.
                    </p>
                  ),
                },
                {
                  value: 'ship',
                  label: 'Ship',
                  description: 'Compose UI',
                  content: (
                    <p class="text-sm text-muted-foreground pt-3">
                      Mix composite controls and granular primitives with consistent accessibility.
                    </p>
                  ),
                },
              ]}
            />
          </SamplerItem>
        </div>
      </div>

      {/* 2. Composite vs Granular (Pure Code) */}
      <div>
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <h2 class="text-xl tracking-tight font-semibold sm:text-2xl">
              Composite speed. Primitive control.
            </h2>
            <p class="text-sm text-muted-foreground mt-1.5 sm:text-base">
              Start with ready-made controls and drop down to decomposed parts whenever a screen
              needs custom structure.
            </p>
          </div>
          <Button
            as="a"
            href="/docs/composition"
            size="sm"
            variant="link"
            trailing="icon-arrow-right"
            class="shrink-0 self-start sm:self-end"
          >
            Composition guide
          </Button>
        </div>

        {isDesktop() ? (
          <div class="gap-5 grid md:grid-cols-2">
            <CodeCompareCard
              title="Composite · Drop-in"
              description="Zero boilerplate for standard product flows."
              badge="Select"
              badgeVariant="soft"
              code={COMPOSITE_SNIPPET}
            />
            <CodeCompareCard
              title="Granular · Composable"
              description="Own every slot and DOM wrapper when layout demands it."
              badge="BaseSelect"
              badgeVariant="outline"
              code={GRANULAR_SNIPPET}
            />
          </div>
        ) : (
          <Tabs
            size="sm"
            defaultValue="composite"
            items={[
              {
                value: 'composite',
                label: 'Composite',
                content: () => (
                  <div class="pt-4">
                    <CodeCompareCard
                      title="Composite · Drop-in"
                      description="Zero boilerplate for standard product flows."
                      badge="Select"
                      badgeVariant="soft"
                      code={COMPOSITE_SNIPPET}
                    />
                  </div>
                ),
              },
              {
                value: 'granular',
                label: 'Granular',
                content: () => (
                  <div class="pt-4">
                    <CodeCompareCard
                      title="Granular · Composable"
                      description="Own every slot and DOM wrapper when layout demands it."
                      badge="BaseSelect"
                      badgeVariant="outline"
                      code={GRANULAR_SNIPPET}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* 3. Complex Modules & Dual CSS Engine */}
      <div class="gap-6 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div class="p-5 border border-border rounded-xl bg-card flex flex-col min-w-0 justify-between">
          <div>
            <div class="flex flex-wrap gap-2 items-center justify-between">
              <h3 class="text-base font-semibold">Built for dense interfaces</h3>
              <div class="flex flex-wrap gap-1.5">
                <Badge size="sm" variant="soft">
                  moraine/data-table
                </Badge>
                <Badge size="sm" variant="soft">
                  moraine/virtualizer
                </Badge>
                <Badge size="sm" variant="soft">
                  moraine/dnd
                </Badge>
              </div>
            </div>
            <p class="text-sm text-muted-foreground mt-1.5">
              Heavy features ship from optional peer entries so the main bundle stays lean. Drag the
              handle below to resize panes with keyboard and pointer support.
            </p>
          </div>

          <div class="mt-5 border border-border rounded-lg h-44 overflow-hidden">
            <Resizable defaultValue={{ nav: 34, main: 66 }}>
              <Resizable.Panel
                id="nav"
                min={24}
                max={50}
                class="p-3 bg-muted/30 flex flex-col justify-between"
              >
                <span class="text-xs font-medium">Sidebar</span>
                <span class="text-xs text-muted-foreground font-mono">min 24%</span>
              </Resizable.Panel>
              <Resizable.Handle />
              <Resizable.Panel
                id="main"
                min={40}
                class="p-3 bg-background flex flex-col justify-between"
              >
                <span class="text-xs font-medium">Canvas</span>
                <span class="text-xs text-muted-foreground">Drag divider or press arrow keys</span>
              </Resizable.Panel>
            </Resizable>
          </div>

          <div class="mt-4 pt-4 border-t border-border flex flex-wrap gap-x-5 gap-y-2">
            <a href="/components/data-table" class={docsLinkClass}>
              DataTable <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
            </a>
            <a href="/components/tree" class={docsLinkClass}>
              Tree <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
            </a>
            <a href="/components/resizable" class={docsLinkClass}>
              Resizable <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
            </a>
          </div>
        </div>

        <div class="p-5 border border-border rounded-xl bg-card flex flex-col min-w-0 justify-between">
          <div>
            <h3 class="text-base font-semibold">UnoCSS &amp; Tailwind CSS v4</h3>
            <p class="text-sm text-muted-foreground mt-1.5">
              Drop into your existing atomic CSS pipeline with automatic class scanning and shared
              semantic tokens.
            </p>
          </div>

          <div class="mt-5">
            <Tabs
              size="sm"
              value={engineTab()}
              onValueChange={setEngineTab}
              items={[
                {
                  value: 'unocss',
                  label: 'UnoCSS',
                  content: () => (
                    <div class="pt-3 relative">
                      <div class="right-2 top-5 absolute">
                        <CopyButton value={UNOCSS_SNIPPET} size="icon-xs" variant="outline" />
                      </div>
                      <pre class="text-xs leading-5 p-3.5 border border-border/70 rounded-lg bg-muted/30 overflow-x-auto">
                        <code>{UNOCSS_SNIPPET}</code>
                      </pre>
                    </div>
                  ),
                },
                {
                  value: 'tailwind',
                  label: 'Tailwind v4',
                  content: () => (
                    <div class="pt-3 relative">
                      <div class="right-2 top-5 absolute">
                        <CopyButton value={TAILWIND_SNIPPET} size="icon-xs" variant="outline" />
                      </div>
                      <pre class="text-xs leading-5 p-3.5 border border-border/70 rounded-lg bg-muted/30 overflow-x-auto">
                        <code>{TAILWIND_SNIPPET}</code>
                      </pre>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div class="mt-4 pt-4 border-t border-border flex flex-wrap gap-x-5 gap-y-2">
            <a href="/docs/unocss" class={docsLinkClass}>
              UnoCSS setup <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
            </a>
            <a href="/docs/tailwind" class={docsLinkClass}>
              Tailwind setup <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
