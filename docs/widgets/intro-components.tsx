import { For, createMemo } from 'solid-js'
import apiIndex from 'virtual:api-doc'

import { Badge } from '../../src'

export const IntroComponentsWidget = () => {
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

  return (
    <section class="flex flex-col gap-4 relative">
      <Badge variant="outline" classes={{ root: 'absolute end-0 -top-10' }}>
        {apiIndex.components.length} components
      </Badge>

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
  )
}
