import { createMemo, For, Show } from 'solid-js'

import { Badge } from '../../../../src'
import { DOCS_FOCUS_RING_CLASS } from '../../../shared/docs-focus.recipe'
import type { DocsPageEntry } from '../../docs-route'
import { getDocsPages } from '../../docs-route'

export function ComponentsIndex() {
  const sections = createMemo(() => {
    const pages = getDocsPages().filter(
      (page) => page.surface === 'components' && page.path !== '/components',
    )
    const map = new Map<string, DocsPageEntry[]>()
    for (const page of pages) {
      const list = map.get(page.section)
      if (list) {
        list.push(page)
      } else {
        map.set(page.section, [page])
      }
    }
    return Array.from(map.entries(), ([name, items]) => ({
      name,
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
    }))
  })

  return (
    <div class="mt-9 space-y-9">
      <For each={sections()}>
        {(section) => (
          <section aria-label={section.name}>
            <h2 class="text-xl font-semibold mb-4 capitalize">{section.name}</h2>
            <ul class="gap-x-6 gap-y-1 grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
              <For each={section.items}>
                {(page) => (
                  <li>
                    <a
                      href={page.path}
                      class={`text-sm px-2 py-2 rounded-md flex gap-2 transition-colors items-center hover:(text-primary bg-muted/60) ${DOCS_FOCUS_RING_CLASS}`}
                    >
                      <span>{page.label}</span>
                      <Show when={page.badge}>
                        {(badge) => (
                          <Badge size="sm" variant="outline">
                            {badge()}
                          </Badge>
                        )}
                      </Show>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </section>
        )}
      </For>
    </div>
  )
}
