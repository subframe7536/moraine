import { For, Show } from 'solid-js'

import { Badge } from '../../../../src'
import { getDocsPages } from '../../docs-route'

const SECTIONS = ['general', 'form', 'navigation', 'overlay'] as const

export function ComponentsIndex() {
  const pages = getDocsPages().filter(
    (page) => page.surface === 'components' && page.path !== '/components',
  )

  return (
    <div class="mt-9 space-y-9">
      <For each={SECTIONS}>
        {(section) => (
          <section aria-label={section}>
            <h2 class="font-semibold mb-4 capitalize text-xl">{section}</h2>
            <ul class="gap-x-6 gap-y-1 grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
              <For
                each={pages
                  .filter((page) => page.section === section)
                  .sort((a, b) => a.label.localeCompare(b.label))}
              >
                {(page) => (
                  <li>
                    <a
                      href={page.path}
                      class="px-2 py-2 flex gap-2 transition-colors items-center text-sm rounded-md hover:(text-primary bg-muted/60) focus-visible:(outline-none ring-2 ring-ring)"
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
