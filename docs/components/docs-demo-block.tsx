import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { DocsCodeBlock } from './docs-code-block'
import { DOCS_DEMO_BLOCK_CLASS, DOCS_DEMO_BLOCK_PREVIEW_CLASS } from './docs-demo-block.class'

export interface DocsDemoBlockProps {
  component: Component
  source?: string
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  return (
    <section class={DOCS_DEMO_BLOCK_CLASS}>
      <div class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}>
        <Dynamic component={props.component} />
      </div>
      <Show when={props.source}>
        {(source) => <DocsCodeBlock variant="source" html={source()} />}
      </Show>
    </section>
  )
}
