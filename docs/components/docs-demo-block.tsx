import type { Component } from 'solid-js'
import { Show, createSignal, onMount } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { DocsCodeBlock } from './docs-code-block'
import { DOCS_DEMO_BLOCK_CLASS, DOCS_DEMO_BLOCK_PREVIEW_CLASS } from './docs-demo-block.class'

export interface DocsDemoBlockProps {
  component: Component
  source?: string
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  const [isMounted, setIsMounted] = createSignal(false)

  onMount(() => queueMicrotask(() => setIsMounted(true)))

  return (
    <section class={DOCS_DEMO_BLOCK_CLASS}>
      <div class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}>
        <Show when={isMounted()}>
          <Dynamic component={props.component} />
        </Show>
      </div>
      <Show when={props.source}>
        {(source) => <DocsCodeBlock variant="source" html={source()} />}
      </Show>
    </section>
  )
}
