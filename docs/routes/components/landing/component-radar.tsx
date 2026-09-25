import { createSignal } from 'solid-js'

import {
  Accordion,
  Badge,
  Button,
  Card,
  Combobox,
  Dialog,
  Popover,
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

export function ComponentRadar() {
  const [activeCategory, setActiveCategory] = createSignal('form')
  const [sliderVal, setSliderVal] = createSignal(42)
  const [switchVal, setSwitchVal] = createSignal(true)

  return (
    <section aria-labelledby="radar-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <h2 id="radar-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Curated component radar
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            Tactile, accessible primitives engineered for real-world SolidJS applications.
          </p>
        </div>
      </div>

      <Tabs
        value={activeCategory()}
        onChange={setActiveCategory}
        items={[
          {
            value: 'form',
            label: 'Form controls',
            content: (
              <div class="pt-5 gap-4 grid grid-cols-1 md:grid-cols-3">
                <Card
                  compact
                  title="Combobox"
                  description="Searchable collection"
                  class="shadow-sm"
                >
                  <div class="pt-2">
                    <Combobox
                      items={FRAMEWORKS}
                      placeholder="Select tech..."
                      allowClear
                      class="w-full"
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">ARIA 1.2 compliant</span>
                    <a href="/combobox" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card compact title="Slider" description="Parametric range" class="shadow-sm">
                  <div class="pt-2 space-y-2">
                    <div class="text-xs text-muted-foreground flex justify-between">
                      <span>Threshold</span>
                      <span class="text-foreground font-mono font-semibold">{sliderVal()}%</span>
                    </div>
                    <Slider
                      value={sliderVal()}
                      onValueChange={(v) => setSliderVal(Array.isArray(v) ? v[0]! : v)}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Keyboard navigation</span>
                    <a href="/slider" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card compact title="Switch" description="Binary disclosure" class="shadow-sm">
                  <div class="pt-2">
                    <Switch
                      label="Automatic caching"
                      description="Persist query responses"
                      checked={switchVal()}
                      onCheckedChange={setSwitchVal}
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Accessible switch role</span>
                    <a href="/switch" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: 'navigation',
            label: 'Navigation',
            content: (
              <div class="pt-5 gap-4 grid grid-cols-1 md:grid-cols-2">
                <Card compact title="Stepper" description="Multi-stage workflow" class="shadow-sm">
                  <div class="pt-2">
                    <Stepper
                      items={[
                        { value: 'plan', title: 'Plan', icon: 'i-lucide:clipboard-list' },
                        { value: 'build', title: 'Build', icon: 'i-lucide:hammer' },
                        { value: 'ship', title: 'Ship', icon: 'i-lucide:rocket' },
                      ]}
                      defaultValue="build"
                      size="sm"
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Linear or random access</span>
                    <a href="/stepper" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card compact title="Tabs" description="Contextual perspectives" class="shadow-sm">
                  <div class="pt-2">
                    <Tabs
                      size="sm"
                      items={[
                        {
                          value: 'preview',
                          label: 'Preview',
                          content: (
                            <p class="text-xs text-muted-foreground pt-2">
                              Live reactive preview container.
                            </p>
                          ),
                        },
                        {
                          value: 'code',
                          label: 'Code',
                          content: (
                            <p class="text-xs text-muted-foreground pt-2">
                              Syntax-highlighted TSX source.
                            </p>
                          ),
                        },
                        {
                          value: 'notes',
                          label: 'Notes',
                          content: (
                            <p class="text-xs text-muted-foreground pt-2">
                              API requirements and constraints.
                            </p>
                          ),
                        },
                      ]}
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Roving tabindex</span>
                    <a href="/tabs" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: 'overlay',
            label: 'Overlays',
            content: (
              <div class="pt-5 gap-4 grid grid-cols-1 md:grid-cols-3">
                <Card compact title="Dialog" description="Modal focus trap" class="shadow-sm">
                  <div class="pt-2 flex min-h-16 items-center justify-center">
                    <Dialog>
                      <Dialog.Trigger as={Button} size="sm">
                        Open modal
                      </Dialog.Trigger>
                      <Dialog.Content
                        title="Confirmation"
                        body={
                          <p class="text-xs text-muted-foreground">
                            Action completed successfully.
                          </p>
                        }
                      />
                    </Dialog>
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Portaled to body</span>
                    <a href="/dialog" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card compact title="Popover" description="Anchored disclosure" class="shadow-sm">
                  <div class="pt-2 flex min-h-16 items-center justify-center">
                    <Popover>
                      <Popover.Trigger as={Button} variant="outline" size="sm">
                        Toggle popover
                      </Popover.Trigger>
                      <Popover.Content ariaLabel="Quick info">
                        <div class="text-xs text-muted-foreground p-3 max-w-48">
                          Positioned relative to trigger with automated collision detection.
                        </div>
                      </Popover.Content>
                    </Popover>
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Smart collision bounds</span>
                    <a href="/popover" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card compact title="Tooltip" description="Hover & focus tip" class="shadow-sm">
                  <div class="pt-2 flex min-h-16 items-center justify-center">
                    <Tooltip>
                      <Tooltip.Trigger as={Button} variant="ghost" size="sm">
                        Hover or focus me
                      </Tooltip.Trigger>
                      <Tooltip.Content text="Accessible tooltip hint (Esc to dismiss)" />
                    </Tooltip>
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Delayed intent</span>
                    <a href="/tooltip" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: 'elements',
            label: 'Elements',
            content: (
              <div class="pt-5 gap-4 grid grid-cols-1 md:grid-cols-2">
                <Card
                  compact
                  title="Accordion"
                  description="Collapsible disclosures"
                  class="shadow-sm"
                >
                  <div class="pt-2">
                    <Accordion
                      items={[
                        {
                          value: 'q1',
                          label: 'Fine-grained reactivity',
                          content: 'Updates only affected DOM nodes without VDOM re-rendering.',
                        },
                        {
                          value: 'q2',
                          label: 'Layered recipe styling',
                          content: 'Override slots cleanly via classes={{ ... }} props.',
                        },
                      ]}
                      defaultValue={['q1']}
                    />
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Smooth CSS height motion</span>
                    <a href="/accordion" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>

                <Card
                  compact
                  title="Badges & Buttons"
                  description="Interactive tokens"
                  class="shadow-sm"
                >
                  <div class="pt-2 space-y-3">
                    <div class="flex flex-wrap gap-2 items-center">
                      <Button size="sm">Solid</Button>
                      <Button size="sm" variant="outline">
                        Outline
                      </Button>
                      <Button size="sm" variant="secondary">
                        Secondary
                      </Button>
                      <Button size="sm" variant="ghost">
                        Ghost
                      </Button>
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                      <Badge variant="solid">Solid</Badge>
                      <Badge variant="surface">Surface</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>
                  <div class="text-xs mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span class="text-muted-foreground">Standardized variants</span>
                    <a href="/button" class="text-primary hover:underline">
                      Docs →
                    </a>
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </section>
  )
}
