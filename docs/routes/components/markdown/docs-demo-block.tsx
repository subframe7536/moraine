import type { Component } from 'solid-js'
import { Show, createMemo, createSignal, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Dynamic } from 'solid-js/web'

import { cn } from '../../../../src/index.ts'

import { DocsCodeBlock } from './docs-code-block.tsx'
import {
  DocsExampleControls,
  getDocsExampleControlDefaults,
  normalizeDocsExampleControls,
} from './docs-example-controls.tsx'
import type { DocsExampleControlValue, DocsExampleControlValues } from './docs-example-controls.tsx'

const DOCS_DEMO_BLOCK_CLASS =
  'mb-6 mt-4 border border-border/60 rounded-xl bg-card/40 overflow-hidden shadow-xs'
const DOCS_DEMO_BLOCK_PREVIEW_CLASS =
  'p-6 sm:p-8 flex items-center justify-center min-h-[160px] bg-background/60 relative'

export interface DocsDemoBlockProps {
  component?: Component
  source?: string
  playground?: boolean
  controls?: unknown
}

export function DocsDemoBlock(props: DocsDemoBlockProps) {
  const playground = props.playground === true
  const controls = playground ? normalizeDocsExampleControls(props.controls) : []
  const [values, setValues] = createStore<DocsExampleControlValues>(
    getDocsExampleControlDefaults(controls),
  )
  const [isMounted, setIsMounted] = createSignal(false)
  const component = createMemo(() => props.component)
  const source = createMemo(() => props.source)

  onMount(() => queueMicrotask(() => setIsMounted(true)))

  return (
    <section class={DOCS_DEMO_BLOCK_CLASS}>
      <Show
        when={controls.length > 0}
        fallback={
          <div class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}>
            <Show when={isMounted()}>
              <Show when={component()}>
                {(value) => <Dynamic component={value()} {...values} />}
              </Show>
            </Show>
          </div>
        }
      >
        <div class="flex flex-col md:flex-row md:items-stretch">
          <div class={cn(DOCS_DEMO_BLOCK_PREVIEW_CLASS, 'flex-1 min-w-0')}>
            <Show when={isMounted()}>
              <Show when={component()}>
                {(value) => <Dynamic component={value()} {...values} />}
              </Show>
            </Show>
          </div>
          <DocsExampleControls
            controls={controls}
            values={values}
            onChange={(prop, value: DocsExampleControlValue) => setValues(prop, value)}
            onReset={() => setValues(getDocsExampleControlDefaults(controls))}
          />
        </div>
      </Show>
      <Show when={source()}>{(value) => <DocsCodeBlock variant="source" html={value()} />}</Show>
    </section>
  )
}
