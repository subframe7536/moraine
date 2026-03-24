import { For, createMemo } from 'solid-js'
import apiIndex from 'virtual:api-doc'
import { SourceCode } from 'virtual:demo-source'

import { Badge, Button, Card, Icon, Tabs } from '../../../src'

const STARTER_KEYS = ['button', 'input', 'select', 'dialog', 'form', 'tabs']

export default () => {
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
    <div class="mx-auto p-5 max-w-6xl space-y-10 lg:p-10 sm:p-8">
      <section class="py-2">
        <div class="flex flex-col gap-4 max-w-3xl">
          <h1 class="text-4xl text-foreground font-bold mb-2 mt-8 sm:text-5xl">
            Yet Another <span class="text-#4f88c6">Solid.js</span> UI library
          </h1>
          <p class="text-muted-foreground max-w-2xl sm:text-lg">
            Inspired by the best of Nuxt UI and shadcn, Rock UI is a comprehensive SolidJS component
            library with atomic class styling, offering a fast, consistent, and intuitive user
            experiences.
          </p>
          <div class="pt-1 flex flex-wrap gap-2">
            <Button as="a" href="#button">
              Browse components
            </Button>
            <Button as="a" href="#form" variant="secondary">
              View form patterns
            </Button>
            <Button
              as="a"
              href="https://github.com/subframe7536/rock-ui"
              variant="outline"
              target="_blank"
              rel="noreferrer"
              leading="i-lucide:github"
            >
              GitHub
            </Button>
          </div>
        </div>
      </section>

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
              content: <SourceCode lang="bash">bun add @subf/rock-ui</SourceCode>,
            },
            {
              label: 'pnpm',
              value: 'pnpm',
              content: <SourceCode lang="bash">pnpm add @subf/rock-ui</SourceCode>,
            },
            {
              label: 'npm',
              value: 'npm',
              content: <SourceCode lang="bash">npm i @subf/rock-ui</SourceCode>,
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
