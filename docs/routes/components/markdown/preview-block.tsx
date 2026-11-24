import { Dynamic } from '@solidjs/web'
import type { Component } from 'solid-js'
import { createSignal, onSettled, Show } from 'solid-js'

import { CodeBlock } from './code'
import { DOCS_BLOCK_CONTAINER_CLASS, DOCS_PREVIEW_CANVAS_CLASS } from './markdown.recipe'

export interface DocsMdxPreview {
  component?: Component
  source?: string | { html: string; code: string }
}

/**
 * Example block rendered by each generated `?preview` module: the live demo above its
 * highlighted source. The demo mounts only after hydration because the server build renders
 * the preview component as `null`.
 */
export function DocsPreview(props: DocsMdxPreview) {
  const [mounted, setMounted] = createSignal(false)
  onSettled(() => queueMicrotask(() => setMounted(true)))
  const source = (): { html: string; code?: string } | undefined =>
    typeof props.source === 'string' ? { html: props.source } : props.source
  return (
    <section class={DOCS_BLOCK_CONTAINER_CLASS}>
      <div class={DOCS_PREVIEW_CANVAS_CLASS} data-preview-ready={mounted() ? '' : undefined}>
        <Show when={mounted() && props.component}>
          {(value) => <Dynamic component={value()} />}
        </Show>
      </div>
      <Show when={source()}>
        {(value) => (
          <CodeBlock variant="source" lang="tsx" html={value().html} code={value().code} />
        )}
      </Show>
    </section>
  )
}
