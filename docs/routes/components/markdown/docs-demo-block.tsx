import type { Component } from 'solid-js'
import { Show, createSignal, onMount } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { DocsCodeBlock } from './docs-code-block.tsx'

const DOCS_DEMO_BLOCK_CLASS =
  'mb-6 mt-4 border border-border rounded-lg bg-background overflow-hidden'
const DOCS_DEMO_BLOCK_PREVIEW_CLASS = 'p-6 flex items-center justify-center'

export interface DocsDemoBlockProps {
  component?: Component
  source?: string
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  const [isMounted, setIsMounted] = createSignal(false)

  onMount(() => queueMicrotask(() => setIsMounted(true)))

  return (
    <section class={DOCS_DEMO_BLOCK_CLASS}>
      <div class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}>
        <Show when={isMounted()}>
          <Show when={props.component}>{(component) => <Dynamic component={component()} />}</Show>
        </Show>
      </div>
      <Show when={props.source}>
        {(source) => <DocsCodeBlock variant="source" html={source()} />}
      </Show>
    </section>
  )
}
