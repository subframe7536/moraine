import { For, Show, createSignal } from 'solid-js'

import {
  Badge,
  BaseSelect,
  Button,
  CopyButton,
  Icon,
  Resizable,
  Select,
  Tabs,
} from '../../../../src'
import { createMediaQuery } from '../../../../src/utils'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

const FRAMEWORK_ITEMS = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'TypeScript', value: 'ts' },
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

export function ComponentRadar() {
  const isDesktop = createMediaQuery('(min-width: 768px)')
  const [compositeVal, setCompositeVal] = createSignal<string | null>('solid')
  const [granularVal, setGranularVal] = createSignal<string[]>(['unocss'])
  const [engineTab, setEngineTab] = createSignal('unocss')

  function CompositeCard() {
    return (
      <div class="p-5 border border-border rounded-xl bg-card flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold">Composite · Drop-in</h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Zero boilerplate for standard product flows.
            </p>
          </div>
          <Badge size="sm" variant="soft">
            Select
          </Badge>
        </div>

        <Select
          size="sm"
          items={FRAMEWORK_ITEMS}
          value={compositeVal()}
          onValueChange={setCompositeVal}
          placeholder="Choose framework"
          clearable
        />

        <pre class="text-xs leading-5 p-3 border border-border/70 rounded-lg bg-muted/30 overflow-x-auto">
          <code>{COMPOSITE_SNIPPET}</code>
        </pre>
      </div>
    )
  }

  function GranularCard() {
    return (
      <div class="p-5 border border-border rounded-xl bg-card flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold">Granular · Composable</h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Own every slot and DOM wrapper when layout demands it.
            </p>
          </div>
          <Badge size="sm" variant="outline">
            BaseSelect
          </Badge>
        </div>

        <BaseSelect
          items={FRAMEWORK_ITEMS}
          value={granularVal()}
          onValueChange={setGranularVal}
        >
          <BaseSelect.Control>
            <BaseSelect.Trigger class="text-sm px-3 border border-input rounded-md bg-control flex h-8 w-full items-center justify-between">
              <span>
                {FRAMEWORK_ITEMS.find((i) => i.value === granularVal()[0])?.label ??
                  'Choose framework'}
              </span>
              <Icon name="i-lucide:chevrons-up-down" class="text-muted-foreground size-3.5" />
            </BaseSelect.Trigger>
          </BaseSelect.Control>
          <BaseSelect.Content>
            <BaseSelect.Listbox>
              <For each={FRAMEWORK_ITEMS}>{(item) => <BaseSelect.Item item={item} />}</For>
            </BaseSelect.Listbox>
          </BaseSelect.Content>
        </BaseSelect>

        <pre class="text-xs leading-5 p-3 border border-border/70 rounded-lg bg-muted/30 overflow-x-auto">
          <code>{GRANULAR_SNIPPET}</code>
        </pre>
      </div>
    )
  }

  return (
    <section aria-labelledby="radar-title" class="py-10 space-y-12 sm:py-14">
      {/* 1. Composite vs Granular */}
      <div>
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <h2 id="radar-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
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

        <Show
          when={isDesktop()}
          fallback={
            <Tabs
              size="sm"
              defaultValue="composite"
              items={[
                {
                  value: 'composite',
                  label: 'Composite',
                  content: () => (
                    <div class="pt-4">
                      <CompositeCard />
                    </div>
                  ),
                },
                {
                  value: 'granular',
                  label: 'Granular',
                  content: () => (
                    <div class="pt-4">
                      <GranularCard />
                    </div>
                  ),
                },
              ]}
            />
          }
        >
          <div class="gap-5 grid md:grid-cols-2">
            <CompositeCard />
            <GranularCard />
          </div>
        </Show>
      </div>

      {/* 2. Complex Modules & Dual CSS Engine */}
      <div class="gap-6 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div class="p-5 border border-border rounded-xl bg-card flex flex-col justify-between min-w-0">
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
              <Resizable.Panel id="main" min={40} class="p-3 bg-background flex flex-col justify-between">
                <span class="text-xs font-medium">Canvas</span>
                <span class="text-xs text-muted-foreground">
                  Drag divider or press arrow keys
                </span>
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

        <div class="p-5 border border-border rounded-xl bg-card flex flex-col justify-between min-w-0">
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
