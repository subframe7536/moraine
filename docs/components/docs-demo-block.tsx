import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { ShikiCodeBlock } from './shiki-code-block'

export interface DocsDemoBlockProps {
  component: Component
  source?: string
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  return (
    <section class="mb-6 mt-4 border border-border/80 rounded-lg bg-background shadow-xs overflow-hidden">
      <div class="p-6 flex items-center justify-center">
        <Dynamic component={props.component} />
      </div>
      <Show when={props.source}>
        {(source) => <ShikiCodeBlock variant="source" html={source()} />}
      </Show>
    </section>
  )
}
