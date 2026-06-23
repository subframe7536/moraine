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
    <section class="mb-6 mt-4 b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden">
      <div class="p-6 flex items-center justify-center">
        <Dynamic component={props.component} />
      </div>
      <Show when={props.source}>
        {(source) => (
          <ShikiCodeBlock
            variant="source"
            html={source()}
            class="border-t border-border bg-muted/70"
          />
        )}
      </Show>
    </section>
  )
}

export function createDocsDemo(component: Component, source?: string): Component {
  return function DocsDemo() {
    return <DocsDemoBlock component={component} source={source} />
  }
}
