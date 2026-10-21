import { For, Show } from 'solid-js'

import { Badge } from '../../../../src'
import { DOCS_FOCUS_RING_CLASS } from '../../../shared/docs-focus.recipe'
import { getDocsPages } from '../../docs-route'

export function HooksIndex() {
  const pages = () =>
    getDocsPages()
      .filter((page) => page.surface === 'hooks' && page.path !== '/hooks')
      .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div class="mt-9 space-y-6">
      <ul class="gap-4 grid grid-cols-1 md:grid-cols-2">
        <For each={pages()}>
          {(page) => (
            <li>
              <a
                href={page.path}
                class={`p-4 border border-border rounded-lg flex flex-col gap-1.5 transition-colors hover:(border-primary/50 bg-muted/40) ${DOCS_FOCUS_RING_CLASS}`}
              >
                <div class="flex gap-2 items-center justify-between">
                  <span class="text-base text-foreground font-mono font-semibold">
                    {page.label}
                  </span>
                  <Show when={page.badge}>
                    {(badge) => (
                      <Badge size="sm" variant="outline">
                        {badge()}
                      </Badge>
                    )}
                  </Show>
                </div>
                <p class="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
              </a>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
