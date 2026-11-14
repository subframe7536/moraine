import { createSignal } from 'solid-js'
import type { JSX } from 'solid-js'

import {
  Accordion,
  BoldSlider,
  Button,
  Combobox,
  Dialog,
  Icon,
  NumberInput,
  Popover,
  Slider,
  Switch,
  Tabs,
  cn,
} from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

const OPTIONS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'UnoCSS', value: 'unocss' },
  { label: 'Tailwind CSS', value: 'tailwind' },
]

const docsLink = `group text-primary text-sm font-medium inline-flex gap-1 items-center hover:underline ${DOCS_FOCUS_RING_OFFSET_CLASS}`

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
      <a href={props.href} class={cn(docsLink, 'mt-auto pt-6')}>
        Explore {props.title}{' '}
        <Icon
          name="i-lucide:arrow-up-right"
          class="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
        />
      </a>
    </article>
  )
}

export function ComponentRadar() {
  const [value, setValue] = createSignal(42)
  const [boldValue, setBoldValue] = createSignal(70)
  const [emailAlerts, setEmailAlerts] = createSignal(true)
  const [inAppAlerts, setInAppAlerts] = createSignal(false)

  return (
    <section aria-labelledby="radar-title" class="py-12 sm:py-16">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="max-w-2xl">
          <h2 id="radar-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Composite controls & modular primitives.
          </h2>
          <p class="text-sm text-muted-foreground mt-2 sm:text-base">
            Move fast with drop-in composite controls or craft bespoke experiences by assembling
            decomposed parts. Everything arrives fully styled, accessible, and reactive.
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
              marker
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
          <NumberInput aria-label="Item count" defaultValue={3} minValue={1} maxValue={10} />
        </SamplerItem>

        <SamplerItem
          title="Combobox"
          description="Full-featured composite select with typeahead search and clearable input."
          href="/components/combobox"
        >
          <Combobox items={OPTIONS} placeholder="Search technologies..." allowClear />
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
          class="lg:col-span-2 lg:row-span-2 md:col-span-2 lg:col-start-3 lg:row-start-2"
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
      </div>
    </section>
  )
}
