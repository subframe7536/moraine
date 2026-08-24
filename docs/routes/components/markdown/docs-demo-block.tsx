import type { Component } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { DocsCodeBlock } from './docs-code-block.tsx'

const DOCS_DEMO_BLOCK_CLASS =
  'mb-6 mt-4 border border-border/60 rounded-xl bg-card/40 overflow-hidden shadow-xs'
const DOCS_DEMO_BLOCK_PREVIEW_CLASS =
  'p-6 sm:p-8 flex items-center justify-center min-h-[160px] bg-background/60 relative'

export interface DocsDemoBlockProps {
  component?: Component
  source?: string
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  const component = createMemo(() => props.component)
  const source = createMemo(() => props.source)

  return (
    <section class={DOCS_DEMO_BLOCK_CLASS}>
      <div class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}>
        <Show when={component()}>{(value) => <Dynamic component={value()} />}</Show>
      </div>
      <Show when={source()}>{(value) => <DocsCodeBlock variant="source" html={value()} />}</Show>
    </section>
  )
}
