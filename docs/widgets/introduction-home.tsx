import { For, createMemo } from 'solid-js'
import apiIndex from 'virtual:api-doc'

import { Badge, Button, Card, Icon, Tabs } from '../../src'
import { ShikiCodeBlock } from '../components/shiki-code-block'

const STARTER_KEYS = ['button', 'input', 'select', 'dialog', 'form', 'tabs']

export const IntroductionHomeWidget = () => {
  const groupedComponents = createMemo(() => {
    const map = new Map<string, typeof apiIndex.components>()

    for (const component of apiIndex.components) {
      const list = map.get(component.category) ?? []
      list.push(component)
      map.set(component.category, list)
    }

    return [...map.entries()].map(([category, components]) => ({
      category,
      count: components.length,
      components: [...components].sort((a, b) => a.name.localeCompare(b.name)),
    }))
  })

  const starterComponents = createMemo(() => {
    const indexMap = new Map(STARTER_KEYS.map((key, index) => [key, index]))

    return apiIndex.components
      .filter((component) => indexMap.has(component.key))
      .sort((a, b) => (indexMap.get(a.key) ?? 0) - (indexMap.get(b.key) ?? 0))
  })

  return (
    <div class="space-y-10">
      <section class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
        <Card
          compact
          title={
            <span class="flex gap-2 items-center">
              <Icon name="i-lucide:layers-3" />
              Composable API
            </span>
          }
        >
          <p class="text-sm text-muted-foreground">
            Slot-based APIs with class and style overrides, designed for real product surfaces.
          </p>
        </Card>

        <Card
          compact
          title={
            <span class="flex gap-2 items-center">
              <Icon name="i-lucide:sliders-horizontal" />
              Variant Coverage
            </span>
          }
        >
          <p class="text-sm text-muted-foreground">
            Visual variants, sizes, orientation, and state controls aligned across components.
          </p>
        </Card>

        <Card
          compact
          title={
            <span class="flex gap-2 items-center">
              <Icon name="i-lucide:shield-check" />
              Accessible by Default
            </span>
          }
        >
          <p class="text-sm text-muted-foreground">
            Keyboard and aria-ready primitives built on top of mature SolidJS foundations.
          </p>
        </Card>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">Quick Start</h2>
          <p class="text-sm text-muted-foreground">
            Install and start exploring component pages from the sidebar.
          </p>
        </div>

        <Tabs
          defaultValue="bun"
          variant="link"
          size="sm"
          classes={{
            list: 'w-fit',
            content: 'pt-1 [&_pre]:rounded-lg',
            trigger: 'flex-none',
          }}
          items={[
            {
              label: 'bun',
              value: 'bun',
              content: (
                <ShikiCodeBlock variant="source" lang="bash">
                  bun add moraine
                </ShikiCodeBlock>
              ),
            },
            {
              label: 'pnpm',
              value: 'pnpm',
              content: (
                <ShikiCodeBlock variant="source" lang="bash">
                  pnpm add moraine
                </ShikiCodeBlock>
              ),
            },
            {
              label: 'npm',
              value: 'npm',
              content: (
                <ShikiCodeBlock variant="source" lang="bash">
                  npm i moraine
                </ShikiCodeBlock>
              ),
            },
          ]}
        />
      </section>

      <section class="space-y-4">
        <h2 class="text-xl text-foreground font-semibold">Recommended First Components</h2>
        <div class="flex flex-wrap gap-2">
          <For each={starterComponents()}>
            {(component) => (
              <Button as="a" href={`#${component.key}`} variant="outline" size="sm">
                {component.name}
              </Button>
            )}
          </For>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <h2 class="text-xl text-foreground font-semibold">Components</h2>
          <Badge variant="outline">{apiIndex.components.length} components</Badge>
        </div>

        <div class="space-y-6">
          <For each={groupedComponents()}>
            {(group) => (
              <div class="space-y-2">
                <div class="text-primary font-500 flex items-center justify-between">
                  {group.category}
                </div>
                <div class="gap-2 grid lg:grid-cols-4 sm:grid-cols-2">
                  <For each={group.components}>
                    {(component) => (
                      <a
                        href={`#${component.key}`}
                        class="p-3 border border-border rounded-lg bg-background block transition hover:bg-muted"
                      >
                        <p class="text-sm text-foreground font-medium">{component.name}</p>
                        <p class="text-xs text-muted-foreground mt-2">{component.description}</p>
                      </a>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </section>
    </div>
  )
}
