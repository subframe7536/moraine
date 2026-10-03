import { For, Show } from 'solid-js'

import { Badge } from '../../../../src'
import { DOCS_FOCUS_RING_CLASS } from '../../../shared/docs-focus.class'
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
            <h2 class="text-xl font-semibold mb-4 capitalize">{section}</h2>
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
